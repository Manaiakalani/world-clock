import { siteConfig, siteUrl } from "@/lib/site";

/**
 * RFC 9116 security.txt.
 *
 * Served from a route handler rather than public/ so `Canonical` reflects the
 * origin this deployment actually runs on. A stale canonical pointing at a
 * placeholder domain invalidates the file for the researchers it exists to help.
 */
export const dynamic = "force-static";

function expiresOneYearOut(): string {
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  expires.setUTCMilliseconds(0);
  return expires.toISOString().replace(".000", "");
}

export function GET(): Response {
  const body = [
    "# Security contact details for this deployment of World Clock.",
    "# Please report vulnerabilities privately before disclosing them publicly.",
    "",
    `Contact: ${siteConfig.repository}/security/advisories/new`,
    `Expires: ${expiresOneYearOut()}`,
    "Preferred-Languages: en",
    `Canonical: ${siteUrl}/.well-known/security.txt`,
    `Policy: ${siteConfig.repository}/blob/main/SECURITY.md`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
