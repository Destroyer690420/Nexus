import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/*.spec.ts"],
  timeout: 60000,
  use: {
    channel: "chrome",
    baseURL: process.env.BASE_URL || "http://localhost:3000",
  },
});

