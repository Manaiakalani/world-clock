import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Generated rather than served from public/robots.txt so the sitemap URL always
 * matches the deployment's real origin instead of a hardcoded placeholder.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
