import { verifyToken, mintToken } from "../lib/token.js";
import { ALLOWED_EXTS, checkMagic, getMimeType } from "../lib/magic.js";
import { getCorsHeaders, handleOptions } from "../lib/cors.js";

export async function onRequestOptions(context) {
  return handleOptions(context.request, context.env);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request, env);

  // 1. Content-Length required
  const clHeader = request.headers.get("content-length");
  if (!clHeader) {
    return new Response("Length Required", { status: 411, headers: corsHeaders });
  }
  const contentLength = parseInt(clHeader, 10);
  if (isNaN(contentLength)) {
    return new Response("Length Required", { status: 411, headers: corsHeaders });
  }
  if (contentLength === 0) {
    return new Response("Empty body", { status: 400, headers: corsHeaders });
  }

  // 2. Ticket verification (typ up)
  const ticketHeader = request.headers.get("x-ticket");
  if (!ticketHeader) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }
  const ticket = await verifyToken(ticketHeader, "up", env.LINK_SIGNING_SECRET);
  if (!ticket) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // 3. Size limit check
  const maxBytes = typeof ticket.maxBytes === "number" ? ticket.maxBytes : 20000000;
  const maxAllowed = Math.min(maxBytes, 20000000);
  if (contentLength > maxAllowed) {
    return new Response("Payload Too Large", { status: 413, headers: corsHeaders });
  }

  // 4. File name & SHA validation
  const rawFileName = request.headers.get("x-file-name");
  if (!rawFileName) {
    return new Response("Bad Request: missing file name", { status: 400, headers: corsHeaders });
  }
  let fileName;
  try {
    fileName = decodeURIComponent(rawFileName);
  } catch {
    return new Response("Bad Request: invalid file name encoding", { status: 400, headers: corsHeaders });
  }

  const sha = request.headers.get("x-file-sha256");
  if (!sha || !/^[0-9a-fA-F]{64}$/.test(sha)) {
    return new Response("Bad Request: invalid sha256", { status: 400, headers: corsHeaders });
  }

  // 5. Extension allowlist check
  const parts = fileName.toLowerCase().split(".");
  const ext = parts.length > 1 ? parts.pop() : "";
  if (!ext || !ALLOWED_EXTS.includes(ext)) {
    return new Response("Unsupported Media Type", { status: 415, headers: corsHeaders });
  }

  // 6. Peek first chunk for magic check
  if (!request.body) {
    return new Response("Empty body", { status: 400, headers: corsHeaders });
  }
  const reader = request.body.getReader();
  const firstRead = await reader.read();
  if (firstRead.done || !firstRead.value || firstRead.value.length === 0) {
    return new Response("Empty body", { status: 400, headers: corsHeaders });
  }
  const firstChunk = firstRead.value;

  if (!checkMagic(ext, firstChunk)) {
    return new Response("Unsupported Media Type", { status: 415, headers: corsHeaders });
  }

  // 7. Multipart streaming assembly
  const boundary = "----CFPagesGateway" + crypto.randomUUID().replace(/-/g, "");
  const sanitizedName = fileName.replace(/[;\r\n]/g, "_");
  const sanitizedUid = String(ticket.uid ?? "").replace(/[;\r\n]/g, "_");
  const caption = `n=${sanitizedName};u=${sanitizedUid};h=${sha}`;
  const asciiFileName = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");

  const prefixParts = [
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="chat_id"\r\n\r\n`,
    `${env.STORAGE_CHANNEL_ID}\r\n`,
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="disable_notification"\r\n\r\n`,
    `true\r\n`,
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="caption"\r\n\r\n`,
    `${caption}\r\n`,
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="document"; filename="${asciiFileName}"\r\n`,
    `Content-Type: application/octet-stream\r\n\r\n`,
  ].join("");

  const suffixStr = `\r\n--${boundary}--\r\n`;

  const prefixBytes = new TextEncoder().encode(prefixParts);
  const suffixBytes = new TextEncoder().encode(suffixStr);
  const totalLength = prefixBytes.length + contentLength + suffixBytes.length;

  const combinedStream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(prefixBytes);
        controller.enqueue(firstChunk);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.enqueue(suffixBytes);
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  const bodyStream = combinedStream.pipeThrough(new FixedLengthStream(totalLength));

  // 8. Send to Telegram sendDocument
  let tgRes;
  try {
    tgRes = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendDocument`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(totalLength),
      },
      body: bodyStream,
    });
  } catch {
    return new Response("Bad Gateway", { status: 502, headers: corsHeaders });
  }

  if (tgRes.status === 429) {
    const retryAfter = tgRes.headers.get("retry-after") || "60";
    const headers = new Headers(corsHeaders);
    headers.set("Retry-After", retryAfter);
    return new Response("Too Many Requests", { status: 503, headers });
  }

  if (!tgRes.ok) {
    return new Response("Bad Gateway", { status: 502, headers: corsHeaders });
  }

  let tgJson;
  try {
    tgJson = await tgRes.json();
  } catch {
    return new Response("Bad Gateway", { status: 502, headers: corsHeaders });
  }

  if (!tgJson.ok || !tgJson.result || !tgJson.result.document) {
    return new Response("Bad Gateway", { status: 502, headers: corsHeaders });
  }

  const fid = tgJson.result.document.file_id;
  const mid = tgJson.result.message_id;
  const mime = getMimeType(ext);
  const exp = Math.floor(Date.now() / 1000) + 900;

  const rcPayload = {
    typ: "rc",
    fid,
    mid,
    uid: ticket.uid,
    name: fileName,
    mime,
    size: contentLength,
    sha,
    exp,
  };

  const receipt = await mintToken(rcPayload, env.LINK_SIGNING_SECRET);

  const resHeaders = new Headers(corsHeaders);
  resHeaders.set("Content-Type", "application/json");

  return new Response(JSON.stringify({ receipt, size: contentLength, name: fileName }), {
    status: 200,
    headers: resHeaders,
  });
}
