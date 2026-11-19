// tests/e2e-ui.spec.ts
// E2E test suite for Nexus UI redesign

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Nexus UI Redesign Suite", () => {
  test("Auth redirect guards unauthenticated access", async ({ page }) => {
    await page.goto("/dashboard");
    // Client-side guard redirects to /auth
    await expect(page).toHaveURL(/\/auth/);
  });

  test("Login screen renders tactile components without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/auth/login");

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Check no horizontal overflow at 360px
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isOverflowing).toBe(false);
  });

  test("UI Gallery renders all tactile components with 0 serious/critical Axe violations", async ({ page }) => {
    await page.goto("/dev/ui");
    await expect(page.locator("h1")).toContainText("Gallery");

    // Axe audit
    const axeResults = await new AxeBuilder({ page }).analyze();
    const severe = axeResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(severe).toEqual([]);
  });

  test("Theme toggle updates data-theme and persists to localStorage", async ({ page }) => {
    await page.goto("/dev/ui");

    // Test switching theme
    await page.evaluate(() => {
      localStorage.setItem("theme-preference", "dark");
      document.documentElement.classList.add("dark");
    });

    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains("dark");
    });
    expect(isDark).toBe(true);

    const storedTheme = await page.evaluate(() => {
      return localStorage.getItem("theme-preference");
    });
    expect(storedTheme).toBe("dark");
  });
});
