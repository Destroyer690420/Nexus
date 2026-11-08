export function getCorsHeaders(request, env) {
  const allowedOriginsStr = env?.ALLOWED_ORIGINS || "";
  const allowedOrigins = allowedOriginsStr
    .split(",")
    .map(o => o.trim())
    .filter(Boolean);

  const origin = request.headers.get("origin");
  const headers = new Headers();
  headers.set("Vary", "Origin");

  if (origin && allowedOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Content-Length, X-Ticket, X-File-Name, X-File-Sha256"
    );
  }

  return headers;
}

export function handleOptions(request, env) {
  const corsHeaders = getCorsHeaders(request, env);
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
