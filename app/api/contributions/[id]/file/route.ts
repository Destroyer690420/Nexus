import { NextRequest, NextResponse } from "next/server";
import { streamObjectFile } from "@/lib/storage/server/deliver";
import { verifyFileToken } from "@/lib/storage/server/signing";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Contribution preview delivery (admin/faculty review + owner). */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const file = await import("@/lib/storage/server/deliver").then((m) =>
    m.resolveFile("contribution", id)
  );
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (file.status !== "legacy" && !verifyFileToken(file.objectId, token)) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }

  return streamObjectFile(req, file);
}
