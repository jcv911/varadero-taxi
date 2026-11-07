"use client";

import { useLocale, useTranslations } from "next-intl";
import { useBookingStore, selectPrice } from "@/lib/bookingStore";
import { getRoute } from "@/lib/routes";
import { VEHICLES } from "@/lib/vehicles";
import { journeyLabel } from "@/lib/journey";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { formatBookingDate } from "@/lib/bookingDate";

export function BookingReview() {
  const t = useTranslations("booking");
  const tz = useTranslations("zones");
  const tv = useTranslations("vehicles");
  const locale = useLocale();
  const state = useBookingStore();
  const price = useBookingStore(selectPrice);

  const { mode, direction, routeId, vehicleId, date, time, hours } = state;
  const route = routeId ? getRoute(routeId) : null;
  const vehicle = VEHICLES[vehicleId];
  const journey = route
    ? journeyLabel(direction, route, (z) => tz(z))
    : t("route_not_selected");

  const rows: Array<[string, string]> = [
    mode === "hours"
      ? [t("review_hours"), `${hours} h`]
      : [t("review_journey"), journey],
    [t("review_date"), formatBookingDate(date, locale)],
    [t("time_cuba"), time],
    [
      t("review_vehicle"),
      `${tv(vehicleId)} · ${vehicle.passengers} ${t("pax_label")} · ${vehicle.luggage} ${t("bags_label")}`,
    ],
  ];

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
        {t("review_title")}
      </p>
      <dl className="divide-y divide-gold-line overflow-hidden rounded-card border border-gold-line bg-deep/50">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 px-4 py-3">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="min-w-0 text-right text-sm font-medium text-cream">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm font-medium uppercase tracking-wider text-muted">
          {t("total")}
        </span>
        <PriceDisplay value={price} className="text-lg font-bold text-gold" />
      </div>
      <p className="mt-1 text-xs text-muted">{t("pay_cash")}</p>
    </div>
  );
}
