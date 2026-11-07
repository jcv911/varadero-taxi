import type { MetadataRoute } from "next";
import { routing } from "@/lib/i18n/routing";
import { config } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  if (process.env.ALLOW_INDEXING !== "true") {
    return [];
  }

  const base = config.site.url;
  const paths = ["", "/privacidad", "/terminos", "/cancelacion"];

  const languages = Object.fromEntries(
    routing.locales.map((loc) => [loc, `${base}/${loc}`])
  );

  return routing.locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.5,
      alternates: { languages },
    }))
  );
}