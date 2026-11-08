import { verifyToken } from "../../lib/token.js";
import { getCorsHeaders, handleOptions } from "../../lib/cors.js";

export async function onRequestOptions(context) {
  return handleOptions(context.request, context.env);
}

export async function onRequestGet(context) {
  const { params, env, request } = context;
  const token = params.token;

  if (!token) {
    return new Response("Forbidden", { status: 403 });
  }

  // 1. Verify token signature & expiration FIRST (never bypass auth)
  const payload = await verifyToken(token, "dl", env.LINK_SIGNING_SECRET);
  if (!payload || !payload.fid) {
    return new Response("Forbidden", { status: 403 });
  }

  // 2. Prepare client headers based on verified payload
  const ext = (payload.name || "").toLowerCase().split(".").pop() || "";
  const inlineAllowed = ["pdf", "png", "jpeg", "jpg", "webp"].includes(ext);
  const dispType = payload.disp === "inline" && inlineAllowed ? "inline" : "attachment";
  const encodedName = encodeURIComponent(payload.name || "file");
  const contentDisposition = `${dispType}; filename*=UTF-8''${encodedName}`;

  const corsHeaders = getCorsHeaders(request, env);
  const clientHeaders = new Headers(corsHeaders);
  clientHeaders.set("Content-Type", payload.mime || "application/octet-stream");
  clientHeaders.set("Content-Disposition", contentDisposition);
  clientHeaders.set("X-Content-Type-Options", "nosniff");
  clientHeaders.set("Cache-Control", "private, max-age=300");
  clientHeaders.set("Accept-Ranges", "none");

  // 3. Compute synthetic cache key: https://cache.local/c/<sha256 hex of fid>
  const fidBytes = new TextEncoder().encode(payload.fid);
  const fidHashBuf = await crypto.subtle.digest("SHA-256", fidBytes);
  const fidHashHex = Array.from(new Uint8Array(fidHashBuf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  const cacheKey = new Request(`https://cache.local/c/${fidHashHex}`);
  const cache = caches.default;

  // 4. Check cache
  let cached = await cache.match(cacheKey);
  if (cached) {
    clientHeaders.set("x-cache", "HIT");
    if (cached.headers.has("content-length")) {
      clientHeaders.set("Content-Length", cached.headers.get("content-length"));
    }
    return new Response(cached.body, {
      status: 200,
      headers: clientHeaders,
    });
  }

  // 5. Cache miss: fetch from Telegram getFile
  let getFileRes;
  try {
    getFileRes = await fetch(
      `https://api.telegram.org/bot${env.BOT_TOKEN}/getFile?file_id=${encodeURIComponent(payload.fid)}`
    );
  } catch {
    return new Response("Not Found", { status: 404 });
  }

  if (!getFileRes.ok) {
    return new Response("Not Found", { status: 404 });
  }

  let getFileJson;
  try {
    getFileJson = await getFileRes.json();
  } catch {
    return new Response("Not Found", { status: 404 });
  }

  if (!getFileJson.ok || !getFileJson.result || !getFileJson.result.file_path) {
    return new Response("Not Found", { status: 404 });
  }

  const filePath = getFileJson.result.file_path;
  let fileRes;
  try {
    fileRes = await fetch(`https://api.telegram.org/file/bot${env.BOT_TOKEN}/${filePath}`);
  } catch {
    return new Response("Not Found", { status: 404 });
  }

  if (!fileRes.ok) {
    return new Response("Not Found", { status: 404 });
  }

  // 6. Cache put via context.waitUntil with cloned response
  clientHeaders.set("x-cache", "MISS");
  if (fileRes.headers.has("content-length")) {
    clientHeaders.set("Content-Length", fileRes.headers.get("content-length"));
  }

  const [stream1, stream2] = fileRes.body.tee();

  const cacheHeaders = new Headers();
  cacheHeaders.set("Cache-Control", "public, max-age=86400");
  if (fileRes.headers.has("content-length")) {
    cacheHeaders.set("Content-Length", fileRes.headers.get("content-length"));
  }

  const cacheRes = new Response(stream2, {
    status: 200,
    headers: cacheHeaders,
  });

  context.waitUntil(cache.put(cacheKey, cacheRes));

  return new Response(stream1, {
    status: 200,
    headers: clientHeaders,
  });
}
