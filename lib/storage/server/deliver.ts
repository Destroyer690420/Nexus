import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getObject, getActiveLocation } from "./db";
import { deserializeLocation } from "@/lib/storage/telegram/references";
import { telegramDownload } from "@/lib/storage/telegram/download";
import { shardForLocation } from "@/lib/storage/telegram/shard-manager";
import { parseRangeHeader } from "@/lib/storage/telegram/chunks";
import { StorageError } from "@/lib/storage/errors";
import { downloadGate } from "./semaphore";

/**
 * Authorized file delivery.
 *
 * Security model: callers must present a short-lived signed token that was
 * issued ONLY after full Nexus authorization. The file endpoint itself is
 * stateless and cache-safe: responses are `Cache-Control: private` and the
 * URL expires, so no shared cache can serve protected content to an
 * unauthorized user (master prompt §11/§36).
 */

export type FileKind = "resource" | "contribution";

const KIND_TABLE: Record<FileKind, string> = {
  resource: "resources",
  contribution: "contributions",
};

export interface ResolvedFile {
  objectId: string;
  status: string;
  size: number;
  mimeType: string;
  fileName: string;
  sha256: string;
  legacyUrl: string;
}

/** Resolve a logical row to its storage object (or legacy URL). */
export async function resolveFile(kind: FileKind, id: string): Promise<ResolvedFile | null> {
  const table = KIND_TABLE[kind];
  const { data: row } = await supabaseAdmin
    .from(table)
    .select("storageObjectId, fileUrl")
    .eq("id", id)
    .maybeSingle();
  if (!row) return null;

  const r = row as { storageObjectId: string | null; fileUrl: string | null };
  if (!r.storageObjectId) {
    return {
      objectId: "",
      status: "legacy",
      size: 0,
      mimeType: "application/octet-stream",
      fileName: "",
      sha256: "",
      legacyUrl: r.fileUrl ?? "",
    };
  }
  const obj = await getObject(r.storageObjectId);
  if (!obj) return null;
  return {
    objectId: obj.id,
    status: obj.status,
    size: Number(obj.size),
    mimeType: obj.mime_type || "application/pdf",
    fileName: `${kind}-${id}.pdf`,
    sha256: obj.sha256,
    legacyUrl: "",
  };
}

function baseHeaders(f: ResolvedFile): Record<string, string> {
  return {
    "Content-Type": f.mimeType,
    "Accept-Ranges": "bytes",
    ETag: `"${f.sha256.slice(0, 32)}"`,
    // Private: browser may cache briefly; shared caches must not.
    "Cache-Control": "private, max-age=300",
    "X-Content-Type-Options": "nosniff",
  };
}

/**
 * Stream the object honoring HTTP Range semantics. True range support:
 * only the covering 1 MiB blocks are fetched from Telegram.
 */
export async function streamObjectFile(
  req: NextRequest,
  f: ResolvedFile,
  downloadName?: string
): Promise<NextResponse> {
  if (f.status === "legacy") {
    if (!f.legacyUrl) return NextResponse.json({ error: "File missing" }, { status: 404 });
    return NextResponse.redirect(f.legacyUrl, 302);
  }
  if (f.status !== "ready") {
    return NextResponse.json(
      { error: "This file is still processing. Please try again in a minute." },
      { status: 409, headers: { "Retry-After": "60" } }
    );
  }

  const locRow = await getActiveLocation(f.objectId);
  if (!locRow) {
    return NextResponse.json(
      { error: "We're temporarily unable to retrieve this file. Please try again." },
      { status: 503 }
    );
  }

  let loc;
  try {
    loc = deserializeLocation(JSON.stringify(locRow.tg_meta));
  } catch {
    return NextResponse.json({ error: "Stored file metadata is corrupt" }, { status: 500 });
  }

  const rangeHeader = req.headers.get("range");
  const range = parseRangeHeader(rangeHeader, f.size);
  if (!range.ok) {
    if (range.reason === "range not satisfiable") {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${f.size}` },
      });
    }
    return NextResponse.json({ error: "Invalid Range header" }, { status: 400 });
  }
  const rangeOffset = range.start ?? 0;
  const rangeLength = range.end !== undefined ? range.end - rangeOffset + 1 : undefined;

  try {
    // Global bounded concurrency: shed load with 429 instead of collapsing.
    const gate = downloadGate();
    await gate.acquire();
    let dl;
    try {
      const pick = await shardForLocation(locRow.shard_id);
      const client = await pick.manager.getClient();

      dl = await telegramDownload(client as never, loc, {
        offset: rangeOffset,
        length: rangeLength,
        refreshLocation: async () => {
          const Api = (await import("teleproto")).Api;
          const fresh = await client.invoke(
            new Api.channels.GetMessages({
              channel: new Api.InputChannel({
                channelId: BigInt(loc.chatId.replace(/^-100/, "")) as unknown as never,
                accessHash: BigInt(0) as unknown as never,
              }),
              id: [new Api.InputMessageID({ id: loc.messageId })],
            })
          );
          const messages = (fresh as { messages?: Array<{ media?: { document?: { fileReference?: Uint8Array } } }> }).messages ?? [];
          const ref = messages[0]?.media?.document?.fileReference;
          if (!ref) throw new StorageError("PERMANENT", "Reference refresh failed");
          return { ...loc, fileReferenceB64: Buffer.from(ref).toString("base64") };
        },
      });
    } finally {
      // Header bytes are flowing through the response stream; the Telegram
      // block pipeline self-bounds via lookahead, so release the global slot
      // once the initial blocks are scheduled.
      setTimeout(() => gate.release(), 1500);
    }

    const headers = baseHeaders(f);
    headers["Content-Length"] = String(dl.emittedBytes);
    if (downloadName) {
      headers["Content-Disposition"] = `attachment; filename="${downloadName.replace(/[^\w.-]/g, "_")}"`;
    } else {
      headers["Content-Disposition"] = "inline";
    }
    if (range.start !== undefined) {
      headers["Content-Range"] = `bytes ${rangeOffset}-${rangeOffset + dl.emittedBytes - 1}/${f.size}`;
    }

    return new NextResponse(dl.stream as unknown as ReadableStream, {
      status: range.start !== undefined ? 206 : 200,
      headers,
    });
  } catch (err) {
    const mapped = err instanceof StorageError ? err : null;
    console.error(
      JSON.stringify({
        event: "download_failed",
        objectId: f.objectId,
        code: mapped?.code ?? "UNKNOWN",
      })
    );
    if (mapped?.code === "RATE_LIMITED") {
      return NextResponse.json(
        { error: "File service is busy. Please retry shortly." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((mapped.retryAfterMs ?? 5000) / 1000)) } }
      );
    }
    return NextResponse.json(
      { error: "We're temporarily unable to retrieve this file. Please try again." },
      { status: 503 }
    );
  }
}
