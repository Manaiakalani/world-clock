import { test, expect } from "@playwright/test";

test.describe("Globe performance", () => {
  test("clicking a card does not cause globe re-initialization", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    // Start collecting logs AFTER init is done
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("[Globe]")) {
        logs.push(msg.text());
      }
    });

    // Click a region card
    const cards = page.locator(".region-card");
    await cards.first().click();
    await page.waitForTimeout(2000);

    // Should have focus logs but NO init logs
    const initCount = logs.filter((l) => l.includes("init")).length;
    const focusCount = logs.filter((l) => l.includes("focus")).length;

    console.log("Globe logs after click:", logs);
    expect(initCount).toBe(0); // no re-init on click
    expect(focusCount).toBeGreaterThanOrEqual(1);

    // Click another card
    if ((await cards.count()) > 1) {
      await cards.nth(1).click();
      await page.waitForTimeout(2000);
      const initCountFinal = logs.filter((l) => l.includes("init")).length;
      expect(initCountFinal).toBe(0); // still no re-init
    }
  });

  test("globe maintains frame rate during card clicks", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    // Measure frame count over 2 seconds before click
    const framesBefore = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frames = 0;
        const start = performance.now();
        function count() {
          frames++;
          if (performance.now() - start < 2000) {
            requestAnimationFrame(count);
          } else {
            resolve(frames);
          }
        }
        requestAnimationFrame(count);
      });
    });

    // Click a card
    await page.locator(".region-card").first().click();

    // Measure frame count over 2 seconds after click
    const framesAfter = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frames = 0;
        const start = performance.now();
        function count() {
          frames++;
          if (performance.now() - start < 2000) {
            requestAnimationFrame(count);
          } else {
            resolve(frames);
          }
        }
        requestAnimationFrame(count);
      });
    });

    console.log(`Frames before click: ${framesBefore}, after: ${framesAfter}`);
    // Frame rate should not drop more than 40%
    expect(framesAfter).toBeGreaterThan(framesBefore * 0.6);
  });

  test("no excessive re-renders on timer tick", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("[Globe]")) {
        logs.push(msg.text());
      }
    });

    // Wait 5 seconds — timer ticks every 1s
    await page.waitForTimeout(5000);

    // Should have 0 re-inits during this period
    const reInits = logs.filter((l) => l.includes("init")).length;
    console.log("Re-inits during 5s idle:", reInits, logs);
    expect(reInits).toBe(0);
  });
});
