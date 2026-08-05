import { defineConfig } from "@playwright/test";

// Port is configurable so a run can't accidentally latch onto an unrelated
// server that already owns 3000 (reuseExistingServer would happily use it).
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  // The HTML report is what CI uploads as an artifact; it is not produced by
  // the default reporter, so ask for it explicitly.
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    // Enable WebGL rendering in headless mode so COBE globe is visible
    launchOptions: {
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
    },
  },
  webServer: {
    command: `npm run build && npm run start -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
