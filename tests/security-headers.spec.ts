import { test, expect } from "@playwright/test";

test("security headers present and no CSP violations at runtime", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (m) => {
    const t = m.text();
    if (/content security policy|refused to/i.test(t)) violations.push(t);
  });
  page.on("pageerror", (e) => violations.push("pageerror: " + e.message));

  const res = await page.goto("/", { waitUntil: "networkidle" });
  expect(res).not.toBeNull();

  const h = res!.headers();
  console.log("CSP:", h["content-security-policy"]);
  console.log("HSTS:", h["strict-transport-security"]);
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["content-security-policy"]).toContain("https://api.open-meteo.com");
  expect(h["strict-transport-security"]).toContain("max-age=63072000");
  expect(h["x-content-type-options"]).toBe("nosniff");

  // App actually rendered under the policy.
  await expect(page.locator("canvas").first()).toBeVisible();
  expect(await page.locator(".region-card").count()).toBeGreaterThan(0);

  console.log("violations:", violations);
  expect(violations).toEqual([]);
});

// Regression guard: the header icon buttons use an expanded `::after` hit area.
// If that extension is wider than the flex gap it overlaps the neighbouring
// button, and because the later sibling paints on top, clicks near a button's
// right edge fire the WRONG action.
test("header action buttons do not steal each other's clicks", async ({ page }) => {
  const labels = [
    "Toggle clock view",
    "Toggle time format",
    "Manage timezones",
    "Meeting planner",
    "Copy shareable link",
    "Toggle theme",
    "About World Clock",
    "Custom order (drag to reorder)",
    "Sort by time",
  ];

  // The icon row is `hidden xl:flex`; below that the fixed bottom nav takes over.
  for (const width of [1280, 1440, 1600, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const problems: string[] = [];
    let checked = 0;

    for (const label of labels) {
      const btn = page.locator(`button[aria-label="${label}"]`).first();
      if ((await btn.count()) === 0 || !(await btn.isVisible())) continue;
      const box = await btn.boundingBox();
      if (!box) continue;
      checked++;

      // Fully within the viewport — an off-screen button is unclickable because
      // the row's ancestor clips overflow and offers no horizontal scrollbar.
      if (box.x < 0 || box.x + box.width > width) {
        problems.push(
          `${width}px: "${label}" spans ${Math.round(box.x)}..${Math.round(box.x + box.width)}, outside viewport`
        );
        continue;
      }

      const y = box.y + box.height / 2;
      for (const x of [box.x + 1, box.x + box.width / 2, box.x + box.width - 1]) {
        const hit = await page.evaluate(
          ([px, py]) => {
            const el = document.elementFromPoint(px as number, py as number);
            return el?.closest("button")?.getAttribute("aria-label") ?? null;
          },
          [x, y]
        );
        if (hit !== label) {
          problems.push(`${width}px: "${label}" at x=${Math.round(x)} hit "${hit}"`);
        }
      }
    }

    expect(checked, `no header buttons found at ${width}px`).toBeGreaterThan(1);
    expect(problems).toEqual([]);
  }
});

// Below `xl` the header icon row is hidden because the 340-420px panel cannot
// fit it without pushing buttons past the right edge of a viewport that has no
// horizontal scrollbar. The fixed bottom nav must therefore be reachable there.
test("primary actions stay reachable below the xl breakpoint", async ({ page }) => {
  for (const width of [640, 768, 900, 1024, 1152, 1279]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const nav = page.locator('nav[aria-label="Primary actions"]');
    await expect(nav, `bottom nav missing at ${width}px`).toBeVisible();

    const box = await nav.boundingBox();
    expect(box, `bottom nav has no box at ${width}px`).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(Math.round(box!.x + box!.width)).toBeLessThanOrEqual(width);

    // Every action in the bar must be inside the viewport and actually on top.
    const buttons = nav.locator("button");
    const count = await buttons.count();
    expect(count, `no actions in bottom nav at ${width}px`).toBeGreaterThan(1);

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const label = (await btn.getAttribute("aria-label")) ?? (await btn.innerText());
      const bb = await btn.boundingBox();
      expect(bb, `"${label}" has no box at ${width}px`).not.toBeNull();
      expect(bb!.x, `"${label}" clipped left at ${width}px`).toBeGreaterThanOrEqual(0);
      expect(
        Math.round(bb!.x + bb!.width),
        `"${label}" clipped right at ${width}px`
      ).toBeLessThanOrEqual(width);
      await expect(btn, `"${label}" not clickable at ${width}px`).toBeEnabled();
    }
  }
});
// Regression guard: ALL_TIMEZONES keeps several pre-2017 IANA ids, while the
// alias table is written against modern canonical names. Without the mapping
// between them these very common queries silently return nothing.
test("alias search resolves legacy-id timezones", async ({ page }) => {
  await page.goto("/");

  const input = page.locator('input[role="combobox"]');

  for (const [query, expected] of [
    ["delhi", "Kolkata"],
    ["utc", "UTC"],
    ["saigon", "Ho Chi Minh City"],
    ["kyiv", "Kyiv"],
  ] as const) {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(input).toBeVisible();
    await input.fill(query);

    const options = page.locator('[role="option"]');
    await expect(options.first()).toBeVisible();
    await expect(options.filter({ hasText: expected }).first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(input).toBeHidden();
  }
});
