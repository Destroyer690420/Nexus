export const ALLOWED_EXTS = [
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "docx",
  "pptx",
  "xlsx",
  "zip"
];

export function getMimeType(ext) {
  switch (ext.toLowerCase()) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "zip":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
}

export function checkMagic(ext, chunk) {
  if (!chunk || chunk.length < 3) return false;

  const lowExt = ext.toLowerCase();

  // pdf: 25 50 44 46 (%PDF)
  if (lowExt === "pdf") {
    if (chunk.length < 4) return false;
    return (
      chunk[0] === 0x25 &&
      chunk[1] === 0x50 &&
      chunk[2] === 0x44 &&
      chunk[3] === 0x46
    );
  }

  // png: 89 50 4e 47 (\x89PNG)
  if (lowExt === "png") {
    if (chunk.length < 4) return false;
    return (
      chunk[0] === 0x89 &&
      chunk[1] === 0x50 &&
      chunk[2] === 0x4e &&
      chunk[3] === 0x47
    );
  }

  // jpg / jpeg: FF D8 FF
  if (lowExt === "jpg" || lowExt === "jpeg") {
    return chunk[0] === 0xff && chunk[1] === 0xd8 && chunk[2] === 0xff;
  }

  // webp: RIFF....WEBP (bytes 0..3: 52 49 46 46, bytes 8..11: 57 45 42 50)
  if (lowExt === "webp") {
    if (chunk.length < 12) return false;
    const isRiff =
      chunk[0] === 0x52 &&
      chunk[1] === 0x49 &&
      chunk[2] === 0x46 &&
      chunk[3] === 0x46;
    const isWebp =
      chunk[8] === 0x57 &&
      chunk[9] === 0x45 &&
      chunk[10] === 0x42 &&
      chunk[11] === 0x50;
    return isRiff && isWebp;
  }

  // docx, pptx, xlsx, zip: 50 4B 03 04 (PK\x03\x04)
  if (["docx", "pptx", "xlsx", "zip"].includes(lowExt)) {
    if (chunk.length < 4) return false;
    return (
      chunk[0] === 0x50 &&
      chunk[1] === 0x4b &&
      chunk[2] === 0x03 &&
      chunk[3] === 0x04
    );
  }

  return false;
}

