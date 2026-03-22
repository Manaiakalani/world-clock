import { test } from "@playwright/test";

const viewports = [
  { name: "mobile-sm", width: 375, height: 812 },
  { name: "mobile-lg", width: 428, height: 926 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1920, height: 1080 },
];

for (const vp of viewports) {
  test(`responsive screenshot — ${vp.name} (${vp.width}x${vp.height})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
    await page.screenshot({
      path: `screenshots/${vp.name}.png`,
      fullPage: true,
    });
  });
}
