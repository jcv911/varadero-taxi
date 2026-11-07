// The public origin is a deployment concern, not a code constant: it feeds canonical,
// hreflang, Open Graph, JSON-LD and sitemap. Hardcoding it once pointed every one of those
// at a domain that did not serve the site (broken link previews in WhatsApp/Facebook).
//
// Precedence: NEXT_PUBLIC_SITE_URL -> RAILWAY_PUBLIC_DOMAIN (injected by Railway) -> fallback.
const FALLBACK_SITE_URL = "https://varadero-taxi-production.up.railway.app";

/** Accepts "example.com", "https://example.com/" and returns "https://example.com". */
function normalizeSiteUrl(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).origin;
  } catch {
    return null;
  }
}

function resolveSiteUrl(): string {
  return (
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeSiteUrl(process.env.RAILWAY_PUBLIC_DOMAIN) ??
    FALLBACK_SITE_URL
  );
}

export const config = {
  site: {
    // TODO-CONFIRMAR: dominio definitivo. Hasta entonces se resuelve por entorno;
    // define NEXT_PUBLIC_SITE_URL para fijarlo sin tocar código.
    url: resolveSiteUrl(),
    name: "Varadero Taxi",
    phone: "+5358117692",
    // Aquí hubo `address` y `openingHours` con TODO-CONFIRMAR: nadie los leía (se retiraron el 2026-09-27).
    // El JSON-LD arma la dirección en `app/[locale]/layout.tsx`; si el negocio confirma dirección u horario,
    // hay que añadirlos en los dos sitios o el dato no llega a ninguna parte.
    areaServed: "Varadero, Matanzas, Cuba",
  },
  booking: {
    defaultTime: "10:00",
    minLeadHours: 2,
    maxAdvanceDays: 30,
    refPrefix: "VT-",
    whatsappNumber: "+5358117692",
  },
} as const;
