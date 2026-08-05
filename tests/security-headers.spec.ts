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
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const labels = [
    "Toggle clock view",
    "Toggle time format",
    "Manage timezones",
    "Meeting planner",
    "Copy shareable link",
    "Toggle theme",
    "About World Clock",
  ];

  const mismatches: string[] = [];
  let checked = 0;

  for (const label of labels) {
    const btn = page.locator(`button[aria-label="${label}"]`).first();
    if ((await btn.count()) === 0 || !(await btn.isVisible())) continue;
    const box = await btn.boundingBox();
    if (!box) continue;
    checked++;

    const y = box.y + box.height / 2;
    for (const x of [box.x + 1, box.x + box.width / 2, box.x + box.width - 1]) {
      const hit = await page.evaluate(
        ([px, py]) => {
          const el = document.elementFromPoint(px as number, py as number);
          return el?.closest("button")?.getAttribute("aria-label") ?? null;
        },
        [x, y]
      );
      if (hit !== label) mismatches.push(`"${label}" at x=${Math.round(x)} hit "${hit}"`);
    }
  }

  expect(checked).toBeGreaterThan(1);
  expect(mismatches).toEqual([]);
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
