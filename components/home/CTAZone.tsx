"use client";

import { useTranslations } from "next-intl";
import { GoldButton } from "@/components/ui/GoldButton";
import { scrollToBooking } from "@/lib/scroll";

export function CTAZone() {
  const t = useTranslations("cta");

  return (
    <section id="contact" className="border-t border-gold-line bg-base">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl tracking-tight text-cream sm:text-4xl">
          {t("title")}
        </h2>
        <p className="max-w-md text-muted">{t("subtitle")}</p>
        <GoldButton
          onClick={scrollToBooking}
          className="min-h-14 max-w-xs px-10 text-[16px]"
        >
          {t("action")}
        </GoldButton>
      </div>
    </section>
  );
}