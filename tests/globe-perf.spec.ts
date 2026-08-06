import { test, expect, type Page } from "@playwright/test";
import { createHash } from "node:crypto";

test.describe("Globe performance", () => {
  test("clicking a card does not cause globe re-initialization", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto("/", { waitUntil: "domcontentloaded" });
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

    // Should have NO init/re-init logs — globe updates via refs, not recreation
    const initCount = logs.filter((l) => l.includes("init")).length;
    console.log("Globe logs after click:", logs);
    expect(initCount).toBe(0); // no re-init on click

    // Click another card
    if ((await cards.count()) > 1) {
      await cards.nth(1).click();
      await page.waitForTimeout(2000);
      const initCountFinal = logs.filter((l) => l.includes("init")).length;
      expect(initCountFinal).toBe(0); // still no re-init
    }
  });

  // Frame counting is not a usable signal on the CI runner. The same code has
  // reported anywhere from 0.8 to 29 fps between runs, because two Playwright
  // workers share two cores and audit.spec.ts runs for ~6 minutes alongside this
  // spec. Comparing the pre-click rate against the post-click rate then turns
  // that noise into a verdict: a 29.2 -> 1.3 reading looked like a catastrophic
  // regression, while the identical build measured 18.9 -> 19.7 fps locally under
  // CI's exact software-rasteriser flags and 239.5 -> 240.5 fps on a hardware
  // renderer.
  //
  // What the test actually wants to know is whether the globe keeps animating
  // once you interact with it — the failure modes being a stalled render loop, a
  // re-initialised context, or a click that freezes the canvas. Comparing
  // successive screenshots answers exactly that and is immune to CPU contention:
  // it does not matter how slowly frames arrive, only that the picture keeps
  // changing.
  async function distinctFrames(page: Page, samples = 4, gapMs = 1000) {
    // Clip to the globe so the ticking clock on the right cannot masquerade as
    // globe motion.
    const clip = { x: 0, y: 80, width: 820, height: 700 };
    const hashes = new Set<string>();
    for (let i = 0; i < samples; i++) {
      const shot = await page.screenshot({ clip });
      hashes.add(createHash("sha1").update(shot).digest("hex"));
      if (i < samples - 1) await page.waitForTimeout(gapMs);
    }
    return hashes.size;
  }

  test("globe keeps animating after card clicks", async ({ page }) => {
    // Screenshots are the measurement here, and they are slow on a contended
    // software rasteriser.
    test.slow();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const movingBefore = await distinctFrames(page);
    expect(movingBefore).toBeGreaterThan(1);

    // Click a card, then let the transition settle so the reading reflects
    // steady state rather than the one-off cost of the React re-render and the
    // globe easing toward its new focus.
    await page.locator(".region-card").first().click();
    await page.waitForTimeout(2000);

    const movingAfter = await distinctFrames(page);

    console.log(`Distinct globe frames — before click: ${movingBefore}/4, after: ${movingAfter}/4`);

    // The render loop must survive interaction. A frozen canvas yields exactly
    // one distinct frame no matter how starved the runner is.
    expect(movingAfter).toBeGreaterThan(1);
  });

  test("no excessive re-renders on timer tick", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
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
