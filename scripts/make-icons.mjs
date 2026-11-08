// scripts/make-icons.mjs
// Generates PWA and brand icons for Nexus using Sharp

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");

const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E23D73"/>
      <stop offset="100%" stop-color="#C72256"/>
    </linearGradient>
  </defs>

  <!-- 3D bottom ledge for squircle container -->
  <rect x="24" y="36" width="464" height="464" rx="116" fill="#801438"/>

  <!-- Squircle container -->
  <rect x="24" y="24" width="464" height="464" rx="116" fill="url(#bgGrad)"/>
  
  <!-- Subtle inner top highlight -->
  <rect x="28" y="28" width="456" height="220" rx="112" fill="#FFFFFF" opacity="0.08"/>

  <!-- Stickie Mascot in center -->
  <g transform="translate(116, 116) scale(2.0)">
    <!-- Stickie Ledge -->
    <path d="M 22 24 C 22 17.37 27.37 12 34 12 L 106 12 C 112.63 12 118 17.37 118 24 L 118 96 L 90 124 L 34 124 C 27.37 124 22 118.63 22 112 Z" transform="translate(0, 5)" fill="#D48B00"/>
    
    <!-- Stickie Body -->
    <path d="M 22 24 C 22 17.37 27.37 12 34 12 L 106 12 C 112.63 12 118 17.37 118 24 L 118 96 L 90 124 L 34 124 C 27.37 124 22 118.63 22 112 Z" fill="#FFC800"/>

    <!-- Folded Corner -->
    <path d="M 118 96 L 90 96 L 90 124 Z" fill="#D48B00" opacity="0.85"/>
    <path d="M 118 96 L 90 96 L 90 124 Z" fill="none" stroke="#D48B00" stroke-width="2" stroke-linejoin="round"/>

    <!-- Eyes -->
    <ellipse cx="50" cy="56" rx="6" ry="8" fill="#2A1830"/>
    <circle cx="48" cy="53" r="2.2" fill="#FFFFFF"/>
    
    <ellipse cx="90" cy="56" rx="6" ry="8" fill="#2A1830"/>
    <circle cx="88" cy="53" r="2.2" fill="#FFFFFF"/>

    <!-- Cheeks -->
    <circle cx="40" cy="68" r="6" fill="#FF6B8B" opacity="0.7"/>
    <circle cx="100" cy="68" r="6" fill="#FF6B8B" opacity="0.7"/>

    <!-- Happy Smile -->
    <path d="M 60 68 Q 70 78 80 68" stroke="#2A1830" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E23D73"/>
      <stop offset="100%" stop-color="#C72256"/>
    </linearGradient>
  </defs>

  <!-- Full bleed background for adaptive icons -->
  <rect x="0" y="0" width="512" height="512" fill="url(#bgGrad)"/>

  <!-- Stickie Mascot positioned safely within 80% circle -->
  <g transform="translate(136, 136) scale(1.714)">
    <!-- Stickie Ledge -->
    <path d="M 22 24 C 22 17.37 27.37 12 34 12 L 106 12 C 112.63 12 118 17.37 118 24 L 118 96 L 90 124 L 34 124 C 27.37 124 22 118.63 22 112 Z" transform="translate(0, 5)" fill="#D48B00"/>
    
    <!-- Stickie Body -->
    <path d="M 22 24 C 22 17.37 27.37 12 34 12 L 106 12 C 112.63 12 118 17.37 118 24 L 118 96 L 90 124 L 34 124 C 27.37 124 22 118.63 22 112 Z" fill="#FFC800"/>

    <!-- Folded Corner -->
    <path d="M 118 96 L 90 96 L 90 124 Z" fill="#D48B00" opacity="0.85"/>
    <path d="M 118 96 L 90 96 L 90 124 Z" fill="none" stroke="#D48B00" stroke-width="2" stroke-linejoin="round"/>

    <!-- Eyes -->
    <ellipse cx="50" cy="56" rx="6" ry="8" fill="#2A1830"/>
    <circle cx="48" cy="53" r="2.2" fill="#FFFFFF"/>
    
    <ellipse cx="90" cy="56" rx="6" ry="8" fill="#2A1830"/>
    <circle cx="88" cy="53" r="2.2" fill="#FFFFFF"/>

    <!-- Cheeks -->
    <circle cx="40" cy="68" r="6" fill="#FF6B8B" opacity="0.7"/>
    <circle cx="100" cy="68" r="6" fill="#FF6B8B" opacity="0.7"/>

    <!-- Happy Smile -->
    <path d="M 60 68 Q 70 78 80 68" stroke="#2A1830" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;

// Helper: build ICO buffer from 32x32 PNG buffer
function pngToIco(pngBuffer) {
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // 1 image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // width 32
  entry.writeUInt8(32, 1); // height 32
  entry.writeUInt8(0, 2);  // color palette (0 = no palette)
  entry.writeUInt8(0, 3);  // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // size of image data in bytes
  entry.writeUInt32LE(22, 12); // offset of image data (6 header + 16 entry = 22)

  return Buffer.concat([icoHeader, entry, pngBuffer]);
}

async function generate() {
  console.log("Generating brand assets...");

  // 1. Write public/favicon.svg
  await fs.writeFile(path.join(publicDir, "favicon.svg"), standardSvg, "utf-8");
  console.log("✓ public/favicon.svg written");

  const stdBuffer = Buffer.from(standardSvg);
  const maskBuffer = Buffer.from(maskableSvg);

  // 2. Render icon-512.png
  const icon512 = await sharp(stdBuffer).resize(512, 512).png().toBuffer();
  await fs.writeFile(path.join(publicDir, "icon-512.png"), icon512);
  await fs.writeFile(path.join(publicDir, "icon-512x512.png"), icon512);
  console.log("✓ public/icon-512.png & icon-512x512.png (512x512) written");

  // 3. Render icon-512-maskable.png
  const maskable512 = await sharp(maskBuffer).resize(512, 512).png().toBuffer();
  await fs.writeFile(path.join(publicDir, "icon-512-maskable.png"), maskable512);
  console.log("✓ public/icon-512-maskable.png (512x512) written");

  // 4. Render icon-192.png
  const icon192 = await sharp(stdBuffer).resize(192, 192).png().toBuffer();
  await fs.writeFile(path.join(publicDir, "icon-192.png"), icon192);
  await fs.writeFile(path.join(publicDir, "icon-192x192.png"), icon192);
  console.log("✓ public/icon-192.png & icon-192x192.png (192x192) written");

  // 5. Render apple-touch-icon.png (180x180)
  const appleTouch = await sharp(stdBuffer).resize(180, 180).png().toBuffer();
  await fs.writeFile(path.join(publicDir, "apple-touch-icon.png"), appleTouch);
  console.log("✓ public/apple-touch-icon.png (180x180) written");

  // 6. Render favicon.ico (32x32)
  const fav32 = await sharp(stdBuffer).resize(32, 32).png().toBuffer();
  const icoBuffer = pngToIco(fav32);
  await fs.writeFile(path.join(publicDir, "favicon.ico"), icoBuffer);
  console.log("✓ public/favicon.ico (32x32) written");

  console.log("All brand assets generated successfully!");
}

generate().catch((err) => {
  console.error("Error generating brand assets:", err);
  process.exit(1);
});
