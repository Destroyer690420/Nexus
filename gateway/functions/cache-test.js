export async function onRequestGet(context) {
  const cache = caches.default;
  const key = new Request(new URL(context.request.url).origin + "/cache-test");
  const hit = await cache.match(key);
  if (hit) {
    const r = new Response(hit.body, hit);
    r.headers.set("x-cache", "HIT");
    return r;
  }
  const res = new Response(JSON.stringify({ t: Date.now() }), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
  });
  context.waitUntil(cache.put(key, res.clone()));
  const out = new Response(res.body, res);
  out.headers.set("x-cache", "MISS");
  return out;
}

