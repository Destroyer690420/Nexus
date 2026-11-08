import crypto from "node:crypto";

export type UpPayload = {
  typ: "up";
  uid: string;
  maxBytes: number;
  exp: number;
};

export type DlPayload = {
  typ: "dl";
  fid: string;
  name: string;
  mime: string;
  size: number;
  disp: "inline" | "attachment";
  exp: number;
};

export type RcPayload = {
  typ: "rc";
  fid: string;
  mid: number;
  uid: string;
  name: string;
  mime: string;
  size: number;
  sha: string;
  exp: number;
};

export type AnyPayload = UpPayload | DlPayload | RcPayload;

export function getSigningSecret(): string {
  const secret = process.env.LINK_SIGNING_SECRET;
  if (!secret) {
    throw new Error("LINK_SIGNING_SECRET is not configured");
  }
  return secret;
}

export function getGatewayUrl(): string {
  return (
    process.env.FILES_GATEWAY_URL ||
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    process.env.GATEWAY_URL ||
    "https://nexus-files-7b4c.pages.dev"
  ).replace(/\/+$/, "");
}

/**
 * Mint HMAC-SHA256 token matching Cloudflare Pages gateway format:
 * P = base64url(JSON(payload))
 * token = P + "." + base64url(HMAC-SHA256(secret, P))
 */
export function mintToken<T extends AnyPayload>(
  payload: T,
  secretStr?: string
): string {
  const secret = secretStr || getSigningSecret();
  const P = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret)
    .update(P)
    .digest("base64url");
  return `${P}.${sig}`;
}

/**
 * Verify HMAC-SHA256 token and validate typ + exp.
 */
export function verifyToken<T extends AnyPayload["typ"]>(
  token: string,
  expectedTyp: T,
  secretStr?: string
): (Extract<AnyPayload, { typ: T }>) | null {
  if (!token || typeof token !== "string") return null;
  const dotIndex = token.indexOf(".");
  if (dotIndex <= 0) return null;

  const P = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  if (!P || !sig) return null;

  try {
    const secret = secretStr || getSigningSecret();
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(P)
      .digest();

    const providedSig = Buffer.from(sig, "base64url");
    if (providedSig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(providedSig, expectedSig)) return null;

    const payloadJson = Buffer.from(P, "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson);

    if (payload.typ !== expectedTyp) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp <= nowSec) {
      return null;
    }

    return payload as Extract<AnyPayload, { typ: T }>;
  } catch {
    return null;
  }
}
