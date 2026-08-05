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
