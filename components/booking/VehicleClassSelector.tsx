"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { Briefcase, Check, Sparkles, Users } from "lucide-react";
import { VEHICLES, VEHICLE_LIST, type VehicleId } from "@/lib/vehicles";
import { formatUsd, getRoutePrice } from "@/lib/routes";
import { useBookingStore } from "@/lib/bookingStore";
import { cn } from "@/lib/cn";

const VEHICLE_BADGES: Record<VehicleId, string> = {
  sedan: "badge_popular",
  suv: "badge_comfort",
  minivan: "badge_family",
  van: "badge_large",
};

export function VehicleClassSelector() {
  const t = useTranslations("booking");
  const tv = useTranslations("vehicles");
  const vehicleId = useBookingStore((s) => s.vehicleId);
  const mode = useBookingStore((s) => s.mode);
  const routeId = useBookingStore((s) => s.routeId);
  const update = useBookingStore((s) => s.update);
  const reduce = useReducedMotion();
  const [adjusted, setAdjusted] = useState(false);

  function select(id: VehicleId) {
    const state = useBookingStore.getState();
    setAdjusted(state.passengers > VEHICLES[id].passengers || state.luggage > VEHICLES[id].luggage);
    update({ vehicleId: id });
    requestAnimationFrame(() => {
      document
        .getElementById("booking-summary")
        ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    });
  }

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t("vehicle_class")}
        </p>
        <span className="text-[11px] text-muted">
          {t("capacity_label")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {VEHICLE_LIST.map((v) => {
          const isSelected = vehicleId === v.id;
          const badgeKey = VEHICLE_BADGES[v.id as VehicleId];

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => select(v.id as VehicleId)}
              aria-pressed={isSelected}
              className={cn(
                "group relative flex flex-col items-start gap-2 overflow-hidden rounded-card border p-2 text-left transition-all duration-[var(--duration-micro)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:p-2.5",
                isSelected
                  ? "border-gold/70 bg-gradient-to-b from-gold/15 to-gold/5 shadow-[0_0_20px_rgba(232,169,75,0.18)] ring-1 ring-gold/40"
                  : "border-gold-line bg-elevated/50 hover:border-gold-line-strong hover:bg-elevated/80"
              )}
              style={{ transitionTimingFunction: "var(--ease-lux)" }}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[8px] border border-gold-line/30">
                <Image
                  src={v.image}
                  alt={tv(v.id)}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition-transform duration-[var(--duration-complex)] group-hover:scale-105"
                  style={{
                    objectPosition: v.thumbPosition ?? "50% 60%",
                    transitionTimingFunction: "var(--ease-lux)",
                  }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-base/80 via-transparent to-black/30"
                />

                {badgeKey && (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full border border-gold-line/60 bg-base/85 px-1.5 py-0.5 text-[10px] font-medium text-cream/90 backdrop-blur-sm sm:left-2 sm:top-2">
                    <Sparkles className="h-2.5 w-2.5 text-gold" />
                    <span>{t(badgeKey)}</span>
                  </span>
                )}

                {isSelected && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-deep shadow-sm sm:right-2 sm:top-2">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="flex w-full min-w-0 flex-col gap-1 px-0.5 pb-0.5">
                <span className="text-sm font-semibold text-cream group-hover:text-gold transition-colors">
                  {tv(v.id)}
                </span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Users aria-hidden className="h-3.5 w-3.5 text-gold/80" strokeWidth={1.5} />
                    {v.passengers} {t("pax_label")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase aria-hidden className="h-3.5 w-3.5 text-gold/80" strokeWidth={1.5} />
                    {v.luggage} {t("bags_label")}
                  </span>
                </span>
                <div className="mt-1 flex items-baseline justify-between border-t border-gold-line/40 pt-1">
                  <span className="text-[11px] text-muted">
                    {mode === "hours" ? t("mode_hours") : t("total")}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-gold sm:text-base">
                    {mode === "hours" ? formatUsd(v.hourlyUsd) : routeId ? formatUsd(getRoutePrice(routeId, v.id)) : t("route_not_selected")}
                    {mode === "hours" && t("per_hour")}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">{t("capacity_note")}</p>
      {adjusted && <p role="status" className="mt-2 text-sm text-gold">{t("capacity_adjusted")}</p>}
    </div>
  );

}
