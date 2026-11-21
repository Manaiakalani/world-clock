import { expect, type Page, type Response } from "@playwright/test";

/** The app's only third-party fetch. Tests intercept it so CI does not depend
 *  on that API being fast or reachable. The browser still issues the request,
 *  so CSP connect-src still applies. */
export const OPEN_METEO = /https:\/\/api\.open-meteo\.com\//;

const STUB_FORECAST = {
  current: {
    temperature_2m: 18,
    weather_code: 1,
    is_day: 1,
  },
  daily: {
    sunrise: ["2026-01-01T06:30"],
    sunset: ["2026-01-01T17:45"],
  },
};

export async function stubOpenMeteo(page: Page): Promise<void> {
  await page.route(OPEN_METEO, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(STUB_FORECAST),
    })
  );
}

/** Wait until the client app has painted: a canvas is on screen and at least
 *  one region card exists. These are the same signals the security-headers
 *  spec already asserted after navigation. */
export async function waitForAppReady(page: Page): Promise<void> {
  await expect(page.locator("canvas").first()).toBeVisible();
  await expect(page.locator(".region-card").first()).toBeVisible();
}

/** Navigate without networkidle. A continuously animating WebGL globe plus
 *  weather fetches can keep the network busy forever, so wait on real UI
 *  readiness instead. */
export async function gotoApp(
  page: Page,
  waitUntil: "load" | "domcontentloaded" = "load"
): Promise<Response | null> {
  const res = await page.goto("/", { waitUntil });
  await waitForAppReady(page);
  return res;
}
