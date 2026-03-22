import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  use: {
    // Enable WebGL rendering in headless mode so COBE globe is visible
    launchOptions: {
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
    },
  },
});
