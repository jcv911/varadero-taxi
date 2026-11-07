"use client";

import { useTranslations } from "next-intl";
import { ROUTES, formatUsd } from "@/lib/routes";
import type { RouteId } from "@/lib/routes";
import { DIRECTIONS, type Direction } from "@/lib/schemas";
import { useBookingStore } from "@/lib/bookingStore";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";

export function RoutePicker() {
  const t = useTranslations("booking");
  const tz = useTranslations("zones");
  const routeId = useBookingStore((s) => s.routeId);
  const direction = useBookingStore((s) => s.direction);
  const vehicleId = useBookingStore((s) => s.vehicleId);
  const update = useBookingStore((s) => s.update);

  const selectedRoute = routeId ? ROUTES.find((r) => r.id === routeId) : null;
  const isInternal = !!selectedRoute?.internal;

  function zoneLabel(id: (typeof ROUTES)[number]["to"]): string {
    return tz(id);
  }

  function select(id: RouteId) {
    update({ routeId: id, customDestination: "" });
  }

  function routeLabel(r: (typeof ROUTES)[number]): string {
    if (r.internal) return zoneLabel(r.to);
    return direction === "to"
      ? t("route_origin_hint", { place: zoneLabel(r.to) })
      : t("route_dest_hint", { place: zoneLabel(r.to) });
  }

  return (
    <div>
      {!isInternal && (
        <div className="mb-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
            {t("direction_label")}
          </p>
          <div
            role="radiogroup"
            aria-label={t("direction_label")}
            className="grid grid-cols-2 rounded-card border border-gold-line bg-deep/70 p-1"
          >
            {DIRECTIONS.map((d) => (
              <button
                key={d}
                role="radio"
                type="button"
                aria-checked={direction === d}
                onClick={() => update({ direction: d as Direction })}
                className={cn(
                  "min-h-11 rounded-[12px] px-3 text-sm font-medium outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold transition-colors duration-200",
                  direction === d
                    ? "bg-gold text-deep"
                    : "text-muted hover:text-cream"
                )}
              >
                {d === "from" ? t("direction_from") : t("direction_to")}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
        {t("select_route")}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {ROUTES.map((r) => (
          <Chip
            key={r.id}
            label={routeLabel(r)}
            sub={
              <span className="flex items-center justify-between gap-2">
                <span className="text-muted">{r.minutes} min</span>
                <span className="text-gold">
                  {t("from")} {formatUsd(r.priceUsd[vehicleId])}
                </span>
              </span>
            }
            selected={routeId === r.id}
            onSelect={() => select(r.id)}
          />
        ))}
      </div>
    </div>
  );
}
