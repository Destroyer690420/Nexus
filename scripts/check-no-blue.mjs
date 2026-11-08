// scripts/check-no-blue.mjs
// Scans codebase for banned blue/cyan/indigo/sky/violet/teal classes and color values.
// Exemption: The official Google "G" logo asset.

import fs from "node:fs";
import path from "node:path";

function hexToHsl(hex) {
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l: max };

  const l = (max + min) / 2;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  } else if (max === g) {
    h = ((b - r) / d + 2) * 60;
  } else {
    h = ((r - g) / d + 4) * 60;
  }

  return { h, s, l };
}

const BANNED_TW_REGEX = /\b(text|bg|border|ring|stroke|fill)-(blue|indigo|sky|cyan|violet|purple|teal)(-\d+)?\b/g;
const HEX_REGEX = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;

// Exemption: Google OAuth G logo colors: #4285F4
const EXEMPT_HEX = new Set(["#4285f4", "#4285F4"]);

const SCAN_DIRS = ["app", "components"];
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".css"];

let violations = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, lineIdx) => {
    // Check if line is within an exempt Google G asset context
    if (line.includes("google") || line.includes("Google") || line.includes("4285F4")) {
      return;
    }

    // Check Tailwind banned classes
    const twMatches = line.match(BANNED_TW_REGEX);
    if (twMatches) {
      twMatches.forEach((m) => {
        violations.push({
          file: filePath,
          line: lineIdx + 1,
          type: "tailwind-class",
          value: m,
          snippet: line.trim(),
        });
      });
    }

    // Check hex values
    const hexMatches = line.match(HEX_REGEX);
    if (hexMatches) {
      hexMatches.forEach((hex) => {
        if (EXEMPT_HEX.has(hex)) return;
        const { h, s } = hexToHsl(hex);
        // Between 185 and 275 degrees with saturation > 12%
        if (h >= 185 && h <= 275 && s > 0.12) {
          violations.push({
            file: filePath,
            line: lineIdx + 1,
            type: "hex-color",
            value: `${hex} (h=${Math.round(h)}°, s=${Math.round(s * 100)}%)`,
            snippet: line.trim(),
          });
        }
      });
    }
  });
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next") {
        walk(full);
      }
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      scanFile(full);
    }
  }
}

console.log("=== SCANNING FOR BANNED BLUE/CYAN/INDIGO/VIOLET/PURPLE/TEAL ===");
for (const dir of SCAN_DIRS) {
  walk(path.resolve(process.cwd(), dir));
}

if (violations.length > 0) {
  console.error(`Found ${violations.length} banned color violation(s):`);
  violations.forEach((v) => {
    console.error(`  ${v.file}:${v.line} [${v.type}] ${v.value}`);
  });
  console.log("\nNote: Old files will be replaced in Phase 2.");
  process.exit(1);
} else {
  console.log("[PASS] Zero banned blue/indigo/sky/cyan/violet/purple/teal colors found.");
  process.exit(0);
}
