import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { ChevronDown, HandCoins, UserCheck, Wallet } from "lucide-react";
import { BookingWidget } from "@/components/booking/BookingWidget";

const TRUST_POINTS = [
  { icon: Wallet, key: "trust_fixed", detailKey: "trust_fixed_detail" },
  { icon: HandCoins, key: "trust_cash", detailKey: "trust_cash_detail" },
  // "chofer profesional" confirmado por el negocio (2026-09-25).
  { icon: UserCheck, key: "trust_pro", detailKey: "trust_pro_detail" },
] as const;

export async function HeroBanner() {
  const t = await getTranslations("hero");

  return (
    <section
      id="hero"
      className="relative flex min-h-dvh items-start justify-center overflow-hidden lg:items-center"
    >
      <Image
        src="/fleet/sedan-blanco.jpg"
        alt={t("alt")}
        fill
        priority
        sizes="100vw"
        className="object-cover object-[50%_62%]"
      />
      {/* Degradado principal + viñeta atmosférica dorada sutil */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-deep/90 via-deep/80 to-deep"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-48 top-1/4 h-96 w-96 rounded-full bg-gold/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-48 bottom-1/4 h-96 w-96 rounded-full bg-gold/5 blur-[140px]"
      />

      <div className="relative z-10 w-full px-4 pb-16 pt-14 sm:pb-20 sm:pt-20 lg:py-24">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          <div className="min-w-0 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-line bg-gold/10 px-3 py-1 text-xs font-semibold tracking-wider text-gold uppercase shadow-[0_0_16px_rgba(232,169,75,0.15)]">
              {t("kicker")}
            </span>
            <h1 className="mt-4 font-display text-[clamp(1.75rem,1.25rem+2vw,3rem)] leading-tight tracking-tight text-balance text-cream">
              {t("title")}
            </h1>
            <p className="mt-3 text-sm text-muted sm:mt-4 sm:text-lg">{t("subtitle")}</p>

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:mt-7 lg:justify-start">
              {TRUST_POINTS.map(({ icon: Icon, key, detailKey }) => (
                <li
                  key={key}
                  className="flex min-w-0 items-center gap-2 rounded-full border border-gold-line bg-elevated/70 px-3.5 py-1.5 text-xs text-cream/90 shadow-[0_2px_8px_rgba(0,0,0,0.4)] backdrop-blur-md transition-colors hover:border-gold-line-strong hover:text-cream"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <Icon aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <span className="font-medium">{t(key)}</span>
                  <span className="hidden text-[11px] text-muted xl:inline">
                    · {t(detailKey)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div id="widget" className="w-full min-w-0 scroll-mt-24">
            <BookingWidget />
          </div>
        </div>

        <a
          href="#fleet"
          aria-label={t("scroll_hint")}
          className="hero-scroll-hint mx-auto mt-10 flex h-11 w-11 items-center justify-center rounded-full text-muted outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:text-gold sm:hidden"
        >
          <ChevronDown aria-hidden className="h-5 w-5" strokeWidth={1.5} />
        </a>
      </div>
    </section>
  );
}
