import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const allowIndexing = process.env.ALLOW_INDEXING === "true";

  if (!allowIndexing) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${config.site.url}/sitemap.xml`,
  };
}