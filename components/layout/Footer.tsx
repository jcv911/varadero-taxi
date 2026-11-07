import { getTranslations } from "next-intl/server";
import { Banknote, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { config } from "@/lib/config";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export async function Footer() {
  const t = await getTranslations("footer");
  const tc = await getTranslations("common");

  return (
    <footer className="border-t border-gold-line bg-gradient-to-b from-base to-deep">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-2xl text-cream tracking-tight">{tc("siteName")}</p>
            <p className="mt-2 text-sm text-muted leading-relaxed">{tc("tagline")}</p>

            {/* Badges de divisas / pago seguro */}
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold/90">
                {t("currencies_title")}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-line bg-surface/70 px-3 py-1 text-xs text-cream/90">
                  <Banknote className="h-3.5 w-3.5 text-gold" />
                  <span>{t("currency_usd")}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-line bg-surface/70 px-3 py-1 text-xs text-cream/90">
                  <Banknote className="h-3.5 w-3.5 text-gold" />
                  <span>{t("currency_eur")}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-line bg-surface/70 px-3 py-1 text-xs text-cream/90">
                  <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                  <span>{t("currency_cup")}</span>
                </span>
              </div>
            </div>
          </div>

          <nav aria-label={t("contact")} className="flex flex-col gap-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold/90">
              {t("contact")}
            </p>
            <a
              href={buildWhatsAppLink("")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gold-line bg-surface/50 px-3.5 py-2 text-muted transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:border-gold-line-strong hover:text-cream"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-cream block sm:inline font-medium">
                  {t("whatsapp_support")}:
                </strong>{" "}
                {config.booking.whatsappNumber}
              </span>
            </a>
            <Link
              href="/privacidad"
              className="inline-flex min-h-11 items-center text-muted outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:text-gold"
            >
              {t("privacy")}
            </Link>
            <Link
              href="/terminos"
              className="inline-flex min-h-11 items-center text-muted outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:text-gold"
            >
              {t("terms")}
            </Link>
            <Link
              href="/cancelacion"
              className="inline-flex min-h-11 items-center text-muted outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:text-gold"
            >
              {t("cancellation")}
            </Link>
          </nav>
        </div>

        <div className="mt-10 border-t border-gold-line/40 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
          <span>
            © {new Date().getFullYear()} {tc("siteName")}. {t("rights")}
          </span>
          <span className="text-[11px] text-muted/80">
            Varadero VIP Chauffeur Service
          </span>
        </div>
      </div>
    </footer>
  );
}
