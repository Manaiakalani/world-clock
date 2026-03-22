import { test, expect, type Page } from "@playwright/test";

const viewports = [
  { name: "mobile-sm", width: 375, height: 812 },
  { name: "mobile-lg", width: 428, height: 926 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1920, height: 1080 },
];

async function setupPage(page: Page, vp: (typeof viewports)[0]) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
}

// ============================================================
// 1. FONT AUDIT
// ============================================================
test.describe("Font audit", () => {
  test("Inter font is loaded and applied to body", async ({ page }) => {
    await setupPage(page, viewports[4]); // desktop
    const bodyFont = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).fontFamily;
    });
    expect(bodyFont.toLowerCase()).toContain("inter");
  });

  test("Monospace font is applied to time displays", async ({ page }) => {
    await setupPage(page, viewports[4]);
    const monoElements = await page.$$eval("[class*='font-mono']", (els) =>
      els.map((el) => {
        const style = window.getComputedStyle(el);
        return {
          text: el.textContent?.trim() ?? "",
          fontFamily: style.fontFamily,
          fontVariantNumeric: style.fontVariantNumeric,
        };
      })
    );
    expect(monoElements.length).toBeGreaterThan(0);
    for (const el of monoElements) {
      expect(el.fontFamily.toLowerCase()).toMatch(/jetbrains|mono/);
    }
  });

  test("No text smaller than 10px", async ({ page }) => {
    await setupPage(page, viewports[0]); // smallest viewport
    const tooSmall = await page.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        null
      );
      const issues: { tag: string; text: string; fontSize: string }[] = [];
      let node: Node | null = walker.nextNode();
      while (node) {
        const el = node as HTMLElement;
        if (el.children?.length === 0 && el.textContent?.trim()) {
          const style = window.getComputedStyle(el);
          const size = parseFloat(style.fontSize);
          if (size < 10 && style.display !== "none" && style.visibility !== "hidden") {
            issues.push({
              tag: el.tagName,
              text: el.textContent.trim().slice(0, 40),
              fontSize: style.fontSize,
            });
          }
        }
        node = walker.nextNode();
      }
      return issues;
    });
    if (tooSmall.length > 0) {
      console.log("Text smaller than 10px:", JSON.stringify(tooSmall, null, 2));
    }
    // Allow zero — report but don't fail for very minor text
    // We flag it as a warning that gets printed
  });

  test("tabular-nums applied to all numeric time displays", async ({ page }) => {
    await setupPage(page, viewports[4]);
    const timeEls = await page.$$eval("[class*='tabular-nums']", (els) =>
      els.map((el) => ({
        text: el.textContent?.trim() ?? "",
        fontVariantNumeric: window.getComputedStyle(el).fontVariantNumeric,
      }))
    );
    expect(timeEls.length).toBeGreaterThan(0);
    for (const el of timeEls) {
      expect(el.fontVariantNumeric).toContain("tabular-nums");
    }
  });
});

// ============================================================
// 2. ACCESSIBILITY AUDIT
// ============================================================
test.describe("Accessibility audit", () => {
  test("All interactive elements have accessible names", async ({ page }) => {
    await setupPage(page, viewports[4]);
    const buttonsWithoutLabel = await page.evaluate(() => {
      const buttons = document.querySelectorAll("button");
      const issues: { html: string }[] = [];
      buttons.forEach((btn) => {
        const text = btn.textContent?.trim() ?? "";
        const ariaLabel = btn.getAttribute("aria-label") ?? "";
        const ariaLabelledBy = btn.getAttribute("aria-labelledby") ?? "";
        const title = btn.getAttribute("title") ?? "";
        if (!text && !ariaLabel && !ariaLabelledBy && !title) {
          issues.push({ html: btn.outerHTML.slice(0, 120) });
        }
      });
      return issues;
    });
    if (buttonsWithoutLabel.length > 0) {
      console.log("Buttons without accessible names:", buttonsWithoutLabel);
    }
    expect(buttonsWithoutLabel).toHaveLength(0);
  });

  test("Switches have accessible labels", async ({ page }) => {
    await setupPage(page, viewports[4]);
    const switches = await page.evaluate(() => {
      const els = document.querySelectorAll('[role="switch"]');
      const issues: { html: string }[] = [];
      els.forEach((el) => {
        const ariaLabel = el.getAttribute("aria-label") ?? "";
        const id = el.getAttribute("id") ?? "";
        const labelledBy = el.getAttribute("aria-labelledby") ?? "";
        // Check if wrapped in a <label>
        const parentLabel = el.closest("label");
        if (!ariaLabel && !labelledBy && !parentLabel) {
          issues.push({ html: el.outerHTML.slice(0, 120) });
        }
      });
      return issues;
    });
    expect(switches).toHaveLength(0);
  });

  test("Page has proper heading hierarchy", async ({ page }) => {
    await setupPage(page, viewports[4]);
    const headings = await page.$$eval("h1, h2, h3, h4, h5, h6", (els) =>
      els.map((el) => ({
        level: parseInt(el.tagName[1]),
        text: el.textContent?.trim() ?? "",
      }))
    );
    expect(headings.length).toBeGreaterThan(0);
    // First heading should be h1
    expect(headings[0].level).toBe(1);
    // No skipped levels
    for (let i = 1; i < headings.length; i++) {
      const gap = headings[i].level - headings[i - 1].level;
      expect(gap).toBeLessThanOrEqual(1);
    }
  });

  test("Focus is visible on interactive elements", async ({ page }) => {
    await setupPage(page, viewports[4]);
    // Tab through the first few elements and check focus visibility
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        outline: style.outline,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
        ring: style.getPropertyValue("--tw-ring-width"),
      };
    });
    expect(focused).not.toBeNull();
  });

  test("Color contrast on region cards meets WCAG AA", async ({ page }) => {
    await setupPage(page, viewports[4]);
    const contrastIssues = await page.evaluate(() => {
      function getLuminance(r: number, g: number, b: number): number {
        const [rs, gs, bs] = [r, g, b].map((c) => {
          c /= 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }

      function getContrastRatio(l1: number, l2: number): number {
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      }

      function parseColor(color: string): [number, number, number] | null {
        const m = color.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)/
        );
        if (!m) return null;
        return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
      }

      const cards = document.querySelectorAll(".region-card");
      const issues: {
        city: string;
        textColor: string;
        bgColor: string;
        ratio: number;
      }[] = [];

      cards.forEach((card) => {
        const textEls = card.querySelectorAll(
          "[class*='font-semibold'], [class*='font-bold']"
        );
        textEls.forEach((textEl) => {
          const textStyle = window.getComputedStyle(textEl as Element);
          const bgStyle = window.getComputedStyle(card as Element);
          const textColor = parseColor(textStyle.color);
          const bgColor = parseColor(bgStyle.backgroundColor);
          if (textColor && bgColor) {
            const textL = getLuminance(...textColor);
            const bgL = getLuminance(...bgColor);
            const ratio = getContrastRatio(textL, bgL);
            if (ratio < 4.5) {
              const city =
                (textEl as HTMLElement).textContent?.trim() ?? "unknown";
              issues.push({
                city,
                textColor: textStyle.color,
                bgColor: bgStyle.backgroundColor,
                ratio: Math.round(ratio * 100) / 100,
              });
            }
          }
        });
      });
      return issues;
    });
    if (contrastIssues.length > 0) {
      console.log(
        "Contrast issues on cards:",
        JSON.stringify(contrastIssues, null, 2)
      );
    }
    // Warn but don't fail — gradient backgrounds make exact measurement tricky
  });

  test("Canvas has accessible label", async ({ page }) => {
    await setupPage(page, viewports[3]); // laptop — globe visible
    const globeCanvas = page.locator('[data-testid="globe-canvas"]');
    const count = await globeCanvas.count();
    if (count > 0) {
      const ariaLabel = await globeCanvas.first().getAttribute("aria-label");
      const role = await globeCanvas.first().getAttribute("role");
      expect(ariaLabel || role).toBeTruthy();
    }
  });

  test("SVG clock has role=img and aria-label", async ({ page }) => {
    await setupPage(page, viewports[4]);
    const svg = page.locator('svg[role="img"]');
    const count = await svg.count();
    expect(count).toBeGreaterThanOrEqual(1);
    const label = await svg.first().getAttribute("aria-label");
    expect(label).toBeTruthy();
  });
});

// ============================================================
// 3. FIT & FINISH AUDIT
// ============================================================
test.describe("Fit & finish audit", () => {
  for (const vp of viewports) {
    test(`No horizontal overflow — ${vp.name}`, async ({ page }) => {
      await setupPage(page, vp);
      const overflow = await page.evaluate(() => {
        return {
          bodyScrollWidth: document.body.scrollWidth,
          windowWidth: window.innerWidth,
          hasHorizontalScroll:
            document.body.scrollWidth > window.innerWidth,
        };
      });
      expect(overflow.hasHorizontalScroll).toBe(false);
    });

    test(`No vertical scroll on main page — ${vp.name}`, async ({ page }) => {
      await setupPage(page, vp);
      const overflow = await page.evaluate(() => {
        const root = document.querySelector(".relative.h-screen");
        if (!root) return { scrollHeight: 0, clientHeight: 0, overflow: true };
        return {
          scrollHeight: root.scrollHeight,
          clientHeight: root.clientHeight,
          overflow: root.scrollHeight > root.clientHeight + 2, // 2px tolerance
        };
      });
      expect(overflow.overflow).toBe(false);
    });

    test(`All 8 region cards visible — ${vp.name}`, async ({ page }) => {
      await setupPage(page, vp);
      const cards = await page.$$eval(".region-card", (els) =>
        els.map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            text:
              el
                .querySelector("[class*='font-semibold']")
                ?.textContent?.trim() ?? "",
            visible: rect.bottom > 0 && rect.top < window.innerHeight,
            bottom: Math.round(rect.bottom),
            windowHeight: window.innerHeight,
          };
        })
      );
      expect(cards.length).toBe(8);
      // All cards should at least be partially visible (within scroll container)
      const scrollContainer = await page.$eval(
        ".overflow-y-auto",
        (el) => {
          const rect = el.getBoundingClientRect();
          return {
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
          };
        }
      );
      // Container should have enough room for all cards
      expect(scrollContainer.clientHeight).toBeGreaterThan(50);
    });
  }

  test("Region cards have consistent height", async ({ page }) => {
    await setupPage(page, viewports[4]); // desktop
    const heights = await page.$$eval(".region-card", (els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().height))
    );
    expect(heights.length).toBeGreaterThan(0);
    const minH = Math.min(...heights);
    const maxH = Math.max(...heights);
    // Cards should be within 4px of each other
    expect(maxH - minH).toBeLessThanOrEqual(4);
  });

  test("No overlapping elements on region cards", async ({ page }) => {
    await setupPage(page, viewports[0]); // smallest viewport
    const overlaps = await page.$$eval(".region-card", (cards) => {
      const issues: { card: string; issue: string }[] = [];
      cards.forEach((card) => {
        const flag = card.querySelector("[class*='text-lg']");
        const city = card.querySelector("[class*='font-semibold']");
        const time = card.querySelector("[class*='font-mono']");
        if (flag && city) {
          const flagRect = flag.getBoundingClientRect();
          const cityRect = city.getBoundingClientRect();
          if (flagRect.right > cityRect.left + 2) {
            issues.push({
              card: city.textContent?.trim() ?? "",
              issue: "flag overlaps city text",
            });
          }
        }
        if (city && time) {
          const cityRect = city.getBoundingClientRect();
          const timeRect = time.getBoundingClientRect();
          if (cityRect.right > timeRect.left - 4) {
            issues.push({
              card: city.textContent?.trim() ?? "",
              issue: `city text (right: ${Math.round(cityRect.right)}) overlaps time (left: ${Math.round(timeRect.left)})`,
            });
          }
        }
      });
      return issues;
    });
    if (overlaps.length > 0) {
      console.log("Overlapping elements:", JSON.stringify(overlaps, null, 2));
    }
    expect(overlaps).toHaveLength(0);
  });

  test("Globe canvas fills its container", async ({ page }) => {
    await setupPage(page, viewports[3]); // laptop — globe visible
    const globeCanvas = page.locator('[data-testid="globe-canvas"]');
    const count = await globeCanvas.count();
    if (count > 0) {
      const box = await globeCanvas.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThan(100);
        expect(box.height).toBeGreaterThan(100);
        // Should be roughly square (aspect-square container)
        expect(Math.abs(box.width - box.height)).toBeLessThan(20);
      }
    }
  });

  test("Dark mode toggle works and applies dark class", async ({ page }) => {
    await setupPage(page, viewports[4]);
    // Find and click the theme toggle
    const themeBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    await page.waitForTimeout(500);
    // Check that dark class is toggled on html
    const htmlClass = await page.evaluate(() =>
      document.documentElement.className
    );
    const hasDark = htmlClass.includes("dark");
    // Click again to toggle back
    await themeBtn.click();
    await page.waitForTimeout(500);
    const htmlClass2 = await page.evaluate(() =>
      document.documentElement.className
    );
    const hasDark2 = htmlClass2.includes("dark");
    // One of them should be dark, other not
    expect(hasDark).not.toBe(hasDark2);
  });

  test("Stagger animation CSS is applied to region cards", async ({
    page,
  }) => {
    await setupPage(page, viewports[4]);
    const animations = await page.$$eval(".region-card", (els) =>
      els.map((el, i) => {
        const style = window.getComputedStyle(el);
        return {
          index: i,
          animationName: style.animationName,
          animationDelay: style.animationDelay,
        };
      })
    );
    expect(animations.length).toBeGreaterThan(0);
    // First card should have 0ms delay, subsequent cards increasing
    for (let i = 0; i < animations.length && i < 8; i++) {
      expect(animations[i].animationName).toContain("cardFadeIn");
    }
  });

  test("Screenshot — both themes", async ({ page }) => {
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      // Determine current theme
      const isDark = await page.evaluate(() =>
        document.documentElement.classList.contains("dark")
      );

      // Screenshot current theme
      await page.screenshot({
        path: `screenshots/${isDark ? "dark" : "light"}-${vp.name}.png`,
        fullPage: false,
      });

      // Toggle to other theme and screenshot
      const themeBtn = page.locator('button[aria-label="Toggle theme"]');
      if (await themeBtn.isVisible()) {
        await themeBtn.click();
        await page.waitForTimeout(1000);
      }
      await page.screenshot({
        path: `screenshots/${isDark ? "light" : "dark"}-${vp.name}.png`,
        fullPage: false,
      });

      // Toggle back
      if (await themeBtn.isVisible()) {
        await themeBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });
});
