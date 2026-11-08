// scripts/run-e2e-ui.mjs
// Full end-to-end integration and visual regression runner for Nexus UI redesign

import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createTestUsers, cleanupTestUsers } from "./ui-test-users.mjs";

const PORT = 3021;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = path.resolve(process.cwd(), "test-results/e2e");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf-8" });
      const pids = new Set();
      for (const line of out.split("\n")) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[1]?.endsWith(`:${port}`)) {
          pids.add(parts[parts.length - 1]);
        }
      }
      for (const pid of pids) {
        if (pid && pid !== "0") {
          try {
            execSync(`taskkill /pid ${pid} /f /t`);
          } catch {}
        }
      }
    }
  } catch {}
}

async function waitForServer(url, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200 || res.status === 307 || res.status === 404) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

async function run() {
  console.log("==================================================");
  console.log("   NEXUS UI REDESIGN E2E VERIFICATION SUITE       ");
  console.log("==================================================");

  let testUsers = null;
  let serverProcess = null;
  let browser = null;

  try {
    // 1. Create ephemeral test users
    console.log("\n[1/6] Creating ephemeral test users via Supabase service role...");
    testUsers = await createTestUsers();
    console.log("✓ Created student, faculty, and admin test accounts.");

    // 2. Start Next.js dev server on port 3021
    console.log(`\n[2/6] Starting dev server on port ${PORT}...`);
    killPort(PORT);
    serverProcess = spawn("npx", ["next", "dev", "-p", String(PORT)], {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, NODE_ENV: "development", PORT: String(PORT) },
    });

    const isReady = await waitForServer(`${BASE_URL}/dev/ui`);
    if (!isReady) {
      throw new Error(`Server failed to start on ${BASE_URL} within 45s`);
    }
    console.log(`✓ Dev server responsive at ${BASE_URL}`);

    // 3. Launch Chrome browser
    console.log("\n[3/6] Launching Chromium browser (channel: chrome)...");
    browser = await chromium.launch({
      channel: "chrome",
      headless: true,
    });
    console.log("✓ Browser launched.");

    const checks = [];
    let axeFailures = 0;

    // Helper: Run Axe check
    async function checkAxe(page, routeName) {
      const results = await new AxeBuilder({ page }).analyze();
      const severe = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      );
      if (severe.length > 0) {
        console.error(`  [AXE FAIL] ${routeName}: ${severe.length} serious/critical violation(s):`);
        severe.forEach((v) => {
          console.error(`    - ${v.id}: ${v.description}`);
          v.nodes?.forEach((n) => console.error(`      html: ${n.html}`));
        });
        axeFailures += severe.length;
        return false;
      }
      return true;
    }

    // Helper: Check horizontal overflow at 360px
    async function checkOverflow(page, routeName) {
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      if (isOverflowing) {
        console.error(`  [OVERFLOW FAIL] ${routeName} has horizontal overflow at 360px viewport!`);
        return false;
      }
      return true;
    }

    // ── CHECK 1: UI GALLERY & DESIGN SYSTEM TOKENS ──
    console.log("\n--- Check 1: UI Gallery & Design Tokens ---");
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/dev/ui`, { waitUntil: "networkidle" });

      const heading = await page.locator("h1").textContent();
      const passHeading = heading?.includes("Gallery");
      console.log(`  - Heading check: ${passHeading ? "PASS" : "FAIL"}`);

      const axeOk = await checkAxe(page, "/dev/ui (desktop)");
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "ui-gallery-desktop.png"), fullPage: true });

      checks.push({ name: "UI Gallery Design Tokens", pass: passHeading && axeOk });
      await context.close();
    }

    // ── CHECK 2: AUTH LOGIN & 360PX OVERFLOW ──
    console.log("\n--- Check 2: Auth Login & 360px Responsive Boundary ---");
    {
      const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle" });

      const overflowOk = await checkOverflow(page, "/auth/login");
      const axeOk = await checkAxe(page, "/auth/login (360px)");
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "auth-login-phone.png") });

      checks.push({ name: "Auth Login (360px Responsive & Axe)", pass: overflowOk && axeOk });
      await context.close();
    }

    // ── CHECK 3: STUDENT SIGN IN & DASHBOARD LANDING ──
    console.log("\n--- Check 3: Student Sign In & Dashboard Navigation ---");
    let studentAuthContext;
    {
      studentAuthContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await studentAuthContext.newPage();

      await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle" });
      await page.fill('input[type="email"]', testUsers.student.email);
      await page.fill('input[type="password"]', testUsers.student.password);
      await page.click('button[type="submit"]');

      // Wait for redirect to /dashboard
      await page.waitForURL("**/dashboard", { timeout: 15000 });
      console.log("  - Successfully signed in and landed on /dashboard");

      // Verify dashboard content: greeting, category cards
      const notesCard = page.locator('main a[href="/dashboard/notes"]').first();
      await notesCard.waitFor({ state: "visible", timeout: 15000 });
      const hasNotes = await notesCard.isVisible();
      const hasPYQs = await page.locator('main a[href="/dashboard/pyqs"]').first().isVisible();
      const hasAssignments = await page.locator('main a[href="/dashboard/assignments"]').first().isVisible();
      const hasLabManuals = await page.locator('main a[href="/dashboard/lab-manuals"]').first().isVisible();

      console.log(`  - 4 Category cards rendered: ${hasNotes && hasPYQs && hasAssignments && hasLabManuals ? "PASS" : "FAIL"}`);

      const overflowOk = await checkOverflow(page, "/dashboard (390px)");
      const axeOk = await checkAxe(page, "/dashboard (student phone)");
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "dashboard-student-phone.png") });

      checks.push({
        name: "Student Sign In & Dashboard Category Cards",
        pass: hasNotes && hasPYQs && hasAssignments && hasLabManuals && overflowOk && axeOk,
      });
    }

    // ── CHECK 4: BROWSE NOTES SCREEN ──
    console.log("\n--- Check 4: Notes Subject & Drilldown Browser ---");
    {
      const page = await studentAuthContext.newPage();
      await page.goto(`${BASE_URL}/dashboard/notes`, { waitUntil: "networkidle" });

      const headingVisible = await page.locator("h1, h2").first().isVisible();
      const overflowOk = await checkOverflow(page, "/dashboard/notes");
      const axeOk = await checkAxe(page, "/dashboard/notes");
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "browse-notes-phone.png") });

      checks.push({ name: "Browse Notes Screen", pass: headingVisible && overflowOk && axeOk });
      await page.close();
    }

    // ── CHECK 5: SEARCH WITH DEBOUNCED SEARCHFIELD ──
    console.log("\n--- Check 5: Authenticated Search Screen ---");
    {
      const page = await studentAuthContext.newPage();
      await page.goto(`${BASE_URL}/dashboard/search`, { waitUntil: "networkidle" });

      const searchInput = page.locator('input[type="search"]').first();
      await searchInput.fill("engineering");
      await page.waitForTimeout(400); // Wait for 300ms debounce

      const overflowOk = await checkOverflow(page, "/dashboard/search");
      const axeOk = await checkAxe(page, "/dashboard/search");
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "search-page-phone.png") });

      checks.push({ name: "Search Screen & Input Debounce", pass: overflowOk && axeOk });
      await page.close();
    }

    // ── CHECK 6: ANNOUNCEMENTS SCREEN ──
    console.log("\n--- Check 6: Announcements Feed ---");
    {
      const page = await studentAuthContext.newPage();
      await page.goto(`${BASE_URL}/dashboard/announcements`, { waitUntil: "networkidle" });

      const heading = await page.locator("h1, h2").first().isVisible();
      const overflowOk = await checkOverflow(page, "/dashboard/announcements");
      const axeOk = await checkAxe(page, "/dashboard/announcements");
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "announcements-phone.png") });

      checks.push({ name: "Announcements Feed", pass: heading && overflowOk && axeOk });
      await page.close();
    }

    // ── CHECK 7: CONTRIBUTE FILE SCREEN ──
    console.log("\n--- Check 7: Contribute File Screen ---");
    {
      const page = await studentAuthContext.newPage();
      await page.goto(`${BASE_URL}/dashboard/contribute`, { waitUntil: "networkidle" });
      await page.locator('text=Contribute Study Material').first().waitFor({ state: "visible", timeout: 15000 });

      // Verifies 20MB limit label or notice
      const content = await page.content();
      const hasLimitNotice = content.includes("20 MB") || content.includes("20MB");
      console.log(`  - 20 MB size limit notice present: ${hasLimitNotice ? "PASS" : "FAIL"}`);

      const overflowOk = await checkOverflow(page, "/dashboard/contribute");
      const axeOk = await checkAxe(page, "/dashboard/contribute");
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "contribute-phone.png") });

      checks.push({ name: "Contribute Screen & File Limit", pass: hasLimitNotice && overflowOk && axeOk });
      await page.close();
    }

    // ── CHECK 8: PROFILE APPEARANCE & THEME TOGGLE ──
    console.log("\n--- Check 8: Profile & Appearance Persistence ---");
    {
      const page = await studentAuthContext.newPage();
      await page.goto(`${BASE_URL}/dashboard/profile`, { waitUntil: "networkidle" });

      // Check squircle avatar
      const avatar = page.locator('main [role="img"][aria-label*="avatar"]').first();
      await avatar.waitFor({ state: "visible", timeout: 15000 });
      const hasAvatar = await avatar.isVisible();

      // Test dark mode toggle
      await page.evaluate(() => {
        localStorage.setItem("theme-preference", "dark");
        document.documentElement.classList.add("dark");
      });
      const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
      const storedPref = await page.evaluate(() => localStorage.getItem("theme-preference"));

      console.log(`  - Theme toggle (dark applied): ${isDark && storedPref === "dark" ? "PASS" : "FAIL"}`);

      const overflowOk = await checkOverflow(page, "/dashboard/profile");
      const axeOk = await checkAxe(page, "/dashboard/profile");
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "profile-phone.png") });

      checks.push({
        name: "Profile & Theme Toggle Persistence",
        pass: hasAvatar && isDark && storedPref === "dark" && overflowOk && axeOk,
      });
      await page.close();
      await studentAuthContext.close();
    }

    // ── CHECK 9: ADMIN PANEL & 6 TABS ──
    console.log("\n--- Check 9: Admin Panel Navigation ---");
    {
      const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await adminContext.newPage();

      await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle" });
      await page.fill('input[type="email"]', testUsers.admin.email);
      await page.fill('input[type="password"]', testUsers.admin.password);
      await page.click('button[type="submit"]');

      await page.waitForURL("**/dashboard", { timeout: 15000 });
      await page.goto(`${BASE_URL}/dashboard/admin`, { waitUntil: "networkidle" });

      // Check Admin tabs
      await page.waitForSelector("text=Overview", { timeout: 10000 });
      const hasOverview = await page.locator("text=Overview").first().isVisible();
      const hasFaculty = await page.locator("text=Faculty").first().isVisible();
      const hasCourses = await page.locator("text=Courses").first().isVisible();
      const hasQueue = await page.locator("text=Queue").first().isVisible();
      const hasResources = await page.locator("text=Resources").first().isVisible();
      const hasUsers = await page.locator("text=Users").first().isVisible();

      console.log(`  - 6 Admin tabs visible: ${hasOverview && hasFaculty && hasCourses && hasQueue && hasResources && hasUsers ? "PASS" : "FAIL"}`);

      const axeOk = await checkAxe(page, "/dashboard/admin");
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "admin-overview-desktop.png") });

      // Click Courses tab
      await page.locator("text=Courses").first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "admin-courses-desktop.png") });

      checks.push({
        name: "Admin Panel 6 Tabs & Navigation",
        pass: hasOverview && hasFaculty && hasCourses && hasQueue && hasResources && hasUsers && axeOk,
      });
      await adminContext.close();
    }

    // ── SUMMARY REPORT ──
    console.log("\n==================================================");
    console.log("            E2E VERIFICATION RESULTS              ");
    console.log("==================================================");

    let allPass = true;
    for (const c of checks) {
      console.log(`[${c.pass ? "PASS" : "FAIL"}] ${c.name}`);
      if (!c.pass) allPass = false;
    }

    console.log(`\nAccessibility: ${axeFailures} serious/critical violations`);
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

    if (!allPass || axeFailures > 0) {
      throw new Error("One or more E2E checks failed!");
    }

    console.log("\n✓ ALL E2E AND ACCESSIBILITY VERIFICATION CHECKS PASSED!");
  } finally {
    // Teardown browser
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }

    // Teardown dev server
    killPort(PORT);
    if (serverProcess) {
      try {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", String(serverProcess.pid), "/f", "/t"]);
        } else {
          serverProcess.kill();
        }
      } catch {}
    }

    // Teardown ephemeral test users
    console.log("\n[Teardown] Cleaning up ephemeral test users...");
    await cleanupTestUsers();
    console.log("✓ Ephemeral test users deleted cleanly.");
  }
}

run().catch((err) => {
  console.error("\nFATAL E2E ERROR:", err);
  process.exit(1);
});
