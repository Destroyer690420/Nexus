export function base64urlEncode(data) {
  let bytes;
  if (typeof data === "string") {
    bytes = new TextEncoder().encode(data);
  } else if (data instanceof Uint8Array) {
    bytes = data;
  } else if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data);
  } else {
    bytes = new Uint8Array(data);
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64urlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function base64urlDecodeToString(str) {
  const bytes = base64urlDecode(str);
  return new TextDecoder().decode(bytes);
}

async function getHmacKey(secretStr) {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretStr),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * P = base64url(payload JSON)
 * token = P + "." + base64url(HMAC-SHA256(LINK_SIGNING_SECRET, P))
 */
export async function mintToken(payload, secretStr) {
  const jsonStr = JSON.stringify(payload);
  const P = base64urlEncode(jsonStr);
  const key = await getHmacKey(secretStr);
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(P)
  );
  const sig = base64urlEncode(sigBuffer);
  return `${P}.${sig}`;
}

export async function verifyToken(token, expectedTyp, secretStr) {
  if (!token || typeof token !== "string") return null;
  const dotIndex = token.indexOf(".");
  if (dotIndex <= 0) return null;

  const P = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  if (!P || !sig) return null;

  try {
    const key = await getHmacKey(secretStr);
    const sigBytes = base64urlDecode(sig);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(P)
    );
    if (!valid) return null;

    const payloadStr = base64urlDecodeToString(P);
    const payload = JSON.parse(payloadStr);

    if (payload.typ !== expectedTyp) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp <= nowSec) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

