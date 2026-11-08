import { mintToken, verifyToken } from "../lib/token.js";

function getSecret() {
  const secret = process.env.LINK_SIGNING_SECRET;
  if (!secret) {
    throw new Error("LINK_SIGNING_SECRET environment variable is missing");
  }
  return secret;
}

export async function mintUpToken({ uid = "test-uid", maxBytes = 20000000, ttlSec = 300 } = {}) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = { typ: "up", uid, maxBytes, exp };
  return await mintToken(payload, getSecret());
}

export async function mintDlToken({
  fid,
  name = "document.pdf",
  mime = "application/pdf",
  size = 1000,
  disp = "inline",
  ttlSec = 300,
}) {
  if (!fid) throw new Error("fid is required for dl token");
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = { typ: "dl", fid, name, mime, size, disp, exp };
  return await mintToken(payload, getSecret());
}

export async function mintRcToken({
  fid,
  mid,
  uid = "test-uid",
  name = "document.pdf",
  mime = "application/pdf",
  size = 1000,
  sha,
  ttlSec = 900,
}) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = { typ: "rc", fid, mid, uid, name, mime, size, sha, exp };
  return await mintToken(payload, getSecret());
}

// CLI usage if invoked directly
if (process.argv[1]?.endsWith("mint.mjs")) {
  const [typ = "up", ...args] = process.argv.slice(2);
  try {
    if (typ === "up") {
      const maxBytes = args[0] ? parseInt(args[0], 10) : 20000000;
      const ttlSec = args[1] ? parseInt(args[1], 10) : 300;
      const token = await mintUpToken({ maxBytes, ttlSec });
      console.log(token);
    } else if (typ === "dl") {
      const [fid, name, mime, size, disp] = args;
      const token = await mintDlToken({
        fid,
        name: name || "file.pdf",
        mime: mime || "application/pdf",
        size: size ? parseInt(size, 10) : 1000,
        disp: disp || "inline",
      });
      console.log(token);
    } else {
      console.error("Unknown token type. Use 'up' or 'dl'.");
      process.exit(1);
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
