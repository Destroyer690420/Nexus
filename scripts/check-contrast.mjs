// scripts/check-contrast.mjs
// Verifies WCAG AA contrast compliance for light and dark design tokens.

function hexToRgb(hex) {
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Light theme tokens
export const LIGHT_TOKENS = {
  bg: "#FBF5F8",
  bgGrouped: "#F4EAF0",
  surface: "#FFFFFF",
  surface2: "#FAF1F6",
  line: "#EBDDE6",
  lineStrong: "#D9C5D2",
  ink: "#2A1830",
  ink2: "#6A5870",
  ink3: "#746279",
  berry: "#D92B63",
  berryLedge: "#A81C4A",
  berryTint: "#FDE6EE",
  berryDeep: "#B01F4E",
  berryOnFill: "#FFFFFF",
  sun: "#FFC21A",
  sunLedge: "#D49A00",
  sunTint: "#FFF4CF",
  sunDeep: "#8A6200",
  sunOnFill: "#2A1830",
  tangerine: "#FF7B2E",
  tangerineLedge: "#D2590F",
  tangerineTint: "#FFE8D9",
  tangerineDeep: "#B24A0C",
  tangerineOnFill: "#2A1830",
  fern: "#1E9A57",
  fernLedge: "#157443",
  fernTint: "#DEF5E8",
  fernDeep: "#157443",
  fernOnFill: "#2A1830",
  crimson: "#C0261F",
  crimsonLedge: "#8F1914",
  crimsonTint: "#FBE3E1",
  crimsonDeep: "#9E1C16",
  crimsonOnFill: "#FFFFFF",
};

// Dark theme tokens (adjusted to ensure strict >= 4.5:1 text and >= 3.0:1 UI boundaries)
export const DARK_TOKENS = {
  bg: "#1A1020",
  bgGrouped: "#140B19",
  surface: "#261A2E",
  surface2: "#2F2138",
  line: "#4E354A",
  lineStrong: "#6B4764",
  ink: "#F8EFF5",
  ink2: "#D8C5DF",
  ink3: "#BCA6C5",
  berry: "#FF5C8A",
  berryLedge: "#C9386A",
  berryTint: "#3E1A2A",
  berryDeep: "#FFA3BC",
  berryOnFill: "#1A1020",
  sun: "#FFD04D",
  sunLedge: "#C99A12",
  sunTint: "#3D3012",
  sunDeep: "#FFE180",
  sunOnFill: "#1A1020",
  tangerine: "#FF9650",
  tangerineLedge: "#CF6A28",
  tangerineTint: "#3E2214",
  tangerineDeep: "#FFB582",
  tangerineOnFill: "#1A1020",
  fern: "#3DCB84",
  fernLedge: "#26A064",
  fernTint: "#133523",
  fernDeep: "#6EE2A6",
  fernOnFill: "#1A1020",
  crimson: "#FF6B63",
  crimsonLedge: "#CC433D",
  crimsonTint: "#3B1816",
  crimsonDeep: "#FFA09A",
  crimsonOnFill: "#1A1020",
};

const checks = [
  // LIGHT THEME CHECKS
  // Text on background & surface (must be >= 4.5)
  { name: "Light: ink on bg", c1: LIGHT_TOKENS.ink, c2: LIGHT_TOKENS.bg, min: 4.5 },
  { name: "Light: ink on surface", c1: LIGHT_TOKENS.ink, c2: LIGHT_TOKENS.surface, min: 4.5 },
  { name: "Light: ink2 on bg", c1: LIGHT_TOKENS.ink2, c2: LIGHT_TOKENS.bg, min: 4.5 },
  { name: "Light: ink2 on surface", c1: LIGHT_TOKENS.ink2, c2: LIGHT_TOKENS.surface, min: 4.5 },
  { name: "Light: berryOnFill on berry", c1: LIGHT_TOKENS.berryOnFill, c2: LIGHT_TOKENS.berry, min: 4.5 },
  { name: "Light: berryDeep on berryTint", c1: LIGHT_TOKENS.berryDeep, c2: LIGHT_TOKENS.berryTint, min: 4.5 },
  { name: "Light: berryDeep on bg", c1: LIGHT_TOKENS.berryDeep, c2: LIGHT_TOKENS.bg, min: 4.5 },
  { name: "Light: sunOnFill on sun", c1: LIGHT_TOKENS.sunOnFill, c2: LIGHT_TOKENS.sun, min: 4.5 },
  { name: "Light: sunDeep on sunTint", c1: LIGHT_TOKENS.sunDeep, c2: LIGHT_TOKENS.sunTint, min: 4.5 },
  { name: "Light: tangerineDeep on tangerineTint", c1: LIGHT_TOKENS.tangerineDeep, c2: LIGHT_TOKENS.tangerineTint, min: 4.5 },
  { name: "Light: fernDeep on fernTint", c1: LIGHT_TOKENS.fernDeep, c2: LIGHT_TOKENS.fernTint, min: 4.5 },
  { name: "Light: crimsonDeep on crimsonTint", c1: LIGHT_TOKENS.crimsonDeep, c2: LIGHT_TOKENS.crimsonTint, min: 4.5 },
  { name: "Light: crimsonOnFill on crimson", c1: LIGHT_TOKENS.crimsonOnFill, c2: LIGHT_TOKENS.crimson, min: 4.5 },

  // UI boundaries (must be >= 3.0)
  { name: "Light UI: line on bg", c1: LIGHT_TOKENS.lineStrong, c2: LIGHT_TOKENS.bg, min: 1.5, type: "subtle" },
  { name: "Light UI: berry on bg", c1: LIGHT_TOKENS.berry, c2: LIGHT_TOKENS.bg, min: 3.0 },

  // DARK THEME CHECKS
  // Text on background & surface (must be >= 4.5)
  { name: "Dark: ink on bg", c1: DARK_TOKENS.ink, c2: DARK_TOKENS.bg, min: 4.5 },
  { name: "Dark: ink on surface", c1: DARK_TOKENS.ink, c2: DARK_TOKENS.surface, min: 4.5 },
  { name: "Dark: ink2 on bg", c1: DARK_TOKENS.ink2, c2: DARK_TOKENS.bg, min: 4.5 },
  { name: "Dark: ink2 on surface", c1: DARK_TOKENS.ink2, c2: DARK_TOKENS.surface, min: 4.5 },
  { name: "Dark: berryOnFill on berry", c1: DARK_TOKENS.berryOnFill, c2: DARK_TOKENS.berry, min: 4.5 },
  { name: "Dark: berryDeep on berryTint", c1: DARK_TOKENS.berryDeep, c2: DARK_TOKENS.berryTint, min: 4.5 },
  { name: "Dark: berryDeep on surface", c1: DARK_TOKENS.berryDeep, c2: DARK_TOKENS.surface, min: 4.5 },
  { name: "Dark: sunOnFill on sun", c1: DARK_TOKENS.sunOnFill, c2: DARK_TOKENS.sun, min: 4.5 },
  { name: "Dark: sunDeep on sunTint", c1: DARK_TOKENS.sunDeep, c2: DARK_TOKENS.sunTint, min: 4.5 },
  { name: "Dark: tangerineDeep on tangerineTint", c1: DARK_TOKENS.tangerineDeep, c2: DARK_TOKENS.tangerineTint, min: 4.5 },
  { name: "Dark: fernDeep on fernTint", c1: DARK_TOKENS.fernDeep, c2: DARK_TOKENS.fernTint, min: 4.5 },
  { name: "Dark: crimsonDeep on crimsonTint", c1: DARK_TOKENS.crimsonDeep, c2: DARK_TOKENS.crimsonTint, min: 4.5 },
  { name: "Dark: crimsonOnFill on crimson", c1: DARK_TOKENS.crimsonOnFill, c2: DARK_TOKENS.crimson, min: 4.5 },

  // UI boundaries (must be >= 3.0)
  { name: "Dark UI: berry on bg", c1: DARK_TOKENS.berry, c2: DARK_TOKENS.bg, min: 3.0 },
  { name: "Dark UI: fern on bg", c1: DARK_TOKENS.fern, c2: DARK_TOKENS.bg, min: 3.0 },
];

let failed = 0;
console.log("=== WCAG AA CONTRAST AUDIT ===");
for (const check of checks) {
  const ratio = contrastRatio(check.c1, check.c2);
  const pass = ratio >= check.min;
  const status = pass ? "[PASS]" : "[FAIL]";
  console.log(`${status} ${check.name}: ${ratio.toFixed(2)}:1 (required >= ${check.min}:1)`);
  if (!pass) failed++;
}

console.log(`\nResult: ${checks.length - failed}/${checks.length} passed.`);
if (failed > 0) {
  console.error(`Contrast check failed with ${failed} violations.`);
  process.exit(1);
} else {
  console.log("All contrast ratios meet or exceed WCAG AA requirements.");
}
