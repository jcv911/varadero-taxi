import type { Metadata, Viewport } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/lib/i18n/routing";
import "@/app/globals.css";
import { inter, playfair } from "@/lib/fonts";
import { config } from "@/lib/config";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  const languages: Record<string, string> = {
    "x-default": `${config.site.url}/${routing.defaultLocale}`,
  };
  for (const loc of routing.locales) {
    languages[loc] = `${config.site.url}/${loc}`;
  }

  const title = t("title");
  const description = t("description");
  const url = `${config.site.url}/${locale}`;
  const ogImage = `${config.site.url}/fleet/sedan-blanco.jpg`;
  const allowIndexing = process.env.ALLOW_INDEXING === "true";

  return {
    metadataBase: new URL(config.site.url),
    title,
    description,
    robots: allowIndexing ? undefined : { index: false, follow: false },
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      type: "website",
      locale,
      url,
      siteName: config.site.name,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 1200, alt: config.site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export const viewport: Viewport = {
  viewportFit: "cover",
  colorScheme: "dark",
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();
  const tc = await getTranslations("common");

  // TODO-CONFIRMAR: dirección postal exacta y datos fiscales del titular (el teléfono y el rango de precios ya son reales)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    name: "Varadero Taxi",
    description: tc("tagline"),
    image: `${config.site.url}/fleet/sedan-blanco.jpg`,
    url: config.site.url,
    telephone: config.site.phone,
    areaServed: config.site.areaServed,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Varadero",
      addressRegion: "Matanzas",
      addressCountry: "CU",
    },
    priceRange: "$15-$165",
  };

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-deep font-sans text-cream antialiased">
        <a
          href="#hero"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-btn focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-deep"
        >
          {tc("skip_to_content")}
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}