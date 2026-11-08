// scripts/verify-ui-gallery.mjs
// Runs Axe accessibility audit and captures screenshots of /dev/ui at 390, 768, 1280 in light and dark.

import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = 3019;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = path.resolve(process.cwd(), "test-results/ui-gallery");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function waitForServer(url, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

async function main() {
  console.log("=== STARTING NEXT.JS DEV SERVER FOR UI AUDIT ===");
  const server = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NODE_ENV: "development" },
  });

  const stopServer = () => {
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"]);
      } else {
        server.kill();
      }
    } catch {}
  };

  process.on("exit", stopServer);
  process.on("SIGINT", stopServer);

  const ready = await waitForServer(`${BASE_URL}/dev/ui`);
  if (!ready) {
    console.error("Failed to start Next.js dev server on port " + PORT);
    stopServer();
    process.exit(1);
  }

  console.log("Server ready at " + BASE_URL);

  const browser = await chromium.launch({
    channel: "chrome",
  });
  let totalViolations = 0;

  try {
    const viewports = [
      { name: "phone-390", width: 390, height: 844 },
      { name: "tablet-768", width: 768, height: 1024 },
      { name: "desktop-1280", width: 1280, height: 900 },
    ];

    for (const vp of viewports) {
      console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      // Light mode
      await page.goto(`${BASE_URL}/dev/ui`, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        document.documentElement.setAttribute("data-theme", "light");
      });
      await page.waitForTimeout(300);

      const lightShotPath = path.join(SCREENSHOT_DIR, `${vp.name}-light.png`);
      await page.screenshot({ path: lightShotPath, fullPage: true });
      console.log(`Saved screenshot: ${lightShotPath}`);

      // Axe accessibility check on light mode
      const lightAxe = await new AxeBuilder({ page }).analyze();
      const lightSevere = lightAxe.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      );
      if (lightSevere.length > 0) {
        console.error(`[FAIL] ${lightSevere.length} serious/critical accessibility violation(s) on ${vp.name} light:`);
        lightSevere.forEach((v) => {
          console.error(`  - ${v.id}: ${v.description}`);
          v.nodes.forEach((n) => console.error(`      node: ${n.html}`));
        });
        totalViolations += lightSevere.length;
      } else {
        console.log(`[PASS] Axe clean on ${vp.name} light mode (0 serious/critical violations)`);
      }

      // Dark mode
      await page.evaluate(() => {
        document.documentElement.setAttribute("data-theme", "dark");
      });
      await page.waitForTimeout(300);

      const darkShotPath = path.join(SCREENSHOT_DIR, `${vp.name}-dark.png`);
      await page.screenshot({ path: darkShotPath, fullPage: true });
      console.log(`Saved screenshot: ${darkShotPath}`);

      // Axe check on dark mode
      const darkAxe = await new AxeBuilder({ page }).analyze();
      const darkSevere = darkAxe.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      );
      if (darkSevere.length > 0) {
        console.error(`[FAIL] ${darkSevere.length} serious/critical accessibility violation(s) on ${vp.name} dark:`);
        darkSevere.forEach((v) => {
          console.error(`  - ${v.id}: ${v.description}`);
          v.nodes.forEach((n) => console.error(`      node: ${n.html}`));
        });
        totalViolations += darkSevere.length;
      } else {
        console.log(`[PASS] Axe clean on ${vp.name} dark mode (0 serious/critical violations)`);
      }

      await context.close();
    }
  } finally {
    await browser.close();
    stopServer();
  }

  console.log("\n=== UI AUDIT SUMMARY ===");
  if (totalViolations > 0) {
    console.error(`FAILED: ${totalViolations} serious or critical accessibility violations found.`);
    process.exit(1);
  } else {
    console.log("SUCCESS: All viewports and themes passed Axe accessibility and screenshots captured.");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
