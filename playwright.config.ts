import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT || "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer:
    process.env.PLAYWRIGHT_SKIP_WEB_SERVER === "1"
      ? undefined
      : {
          command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
});
