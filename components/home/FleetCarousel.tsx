"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { VEHICLE_LIST } from "@/lib/vehicles";
import { getMinRoutePrice, formatUsd } from "@/lib/routes";

export function FleetCarousel() {
  const t = useTranslations("fleet");
  const tv = useTranslations("vehicles");
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-card]");
    const offset = card?.offsetWidth ?? 300;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: direction * offset,
      behavior: reduce ? "auto" : "smooth",
    });
  }

  return (
    <section id="fleet" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-3xl tracking-tight text-cream sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label={t("previous")}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-btn border border-gold-line text-muted outline-none transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:border-gold-line-strong hover:text-gold"
          >
            <ChevronLeft aria-hidden className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label={t("next")}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-btn border border-gold-line text-muted outline-none transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:border-gold-line-strong hover:text-gold"
          >
            <ChevronRight aria-hidden className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[calc(14vw-16px)] pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-0"
      >
        {VEHICLE_LIST.map((v) => (
          <article
            key={v.id}
            data-card
            className="group w-[72vw] snap-center shrink-0 overflow-hidden rounded-card border border-gold-line bg-base/60 transition-all duration-300 hover:border-gold-line-strong sm:w-[25vw] sm:snap-start sm:max-w-xs"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <Image
                src={v.image}
                alt={tv(v.id)}
                fill
                sizes="(max-width: 640px) 72vw, 25vw"
                className="object-cover object-[50%_62%] transition-transform duration-600 group-hover:scale-105"
                style={{ transitionTimingFunction: "var(--ease-lux)" }}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-base via-base/15 to-transparent"
              />
            </div>

            <div className="p-4">
              <h3 className="font-display text-xl text-cream">{tv(v.id)}</h3>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted sm:text-sm">
                <Users aria-hidden className="h-4 w-4 shrink-0 text-gold/80" strokeWidth={1.5} />
                <span>
                  {v.passengers} {t("passengers")}
                </span>
                <span aria-hidden>·</span>
                <span>
                  {v.luggage} {t("bags")}
                </span>
              </p>
              <p className="mt-3 font-semibold tabular-nums text-gold">
                {t("from")} {formatUsd(getMinRoutePrice(v.id))}
              </p>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-4 text-xs italic text-muted">{t("referential")}</p>
    </section>
  );
}
