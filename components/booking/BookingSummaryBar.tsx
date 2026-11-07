"use client";

import { useTranslations } from "next-intl";
import { useBookingStore, selectPrice } from "@/lib/bookingStore";
import { getRoute } from "@/lib/routes";
import { bookingScheduleError } from "@/lib/bookingDate";
import { journeyLabel } from "@/lib/journey";
import { GoldButton } from "@/components/ui/GoldButton";
import { PriceDisplay } from "@/components/ui/PriceDisplay";

export function BookingSummaryBar() {
  const t = useTranslations("booking");
  const tz = useTranslations("zones");
  const tv = useTranslations("vehicles");
  const step = useBookingStore((s) => s.step);
  const setStep = useBookingStore((s) => s.setStep);
  const mode = useBookingStore((s) => s.mode);
  const direction = useBookingStore((s) => s.direction);
  const routeId = useBookingStore((s) => s.routeId);
  const vehicleId = useBookingStore((s) => s.vehicleId);
  const price = useBookingStore(selectPrice);
  const date = useBookingStore((s) => s.date);
  const time = useBookingStore((s) => s.time);
  const hours = useBookingStore((s) => s.hours);

  const route = routeId ? getRoute(routeId) : null;

  const summary = mode === "hours" ? `${hours} h` : route
    ? journeyLabel(direction, route, (z) => tz(z))
    : t("route_not_selected");

  return (
    <div
    id="booking-summary"
    className="flex shrink-0 items-center justify-between gap-3 border-t border-gold-line bg-elevated px-4 py-3 sm:px-6"
  >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          {t("your_reservation")}
        </p>
        <p className="truncate text-sm text-cream">
          {summary} · {tv(vehicleId)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <PriceDisplay value={price} className="text-lg font-bold text-gold" />
        {step < 5 && (
          <GoldButton
            onClick={() => {
              if (step >= 2 && bookingScheduleError(date, time)) {
                setStep(2);
                return;
              }
              setStep((step + 1) as 1 | 2 | 3 | 4 | 5);
            }}
            disabled={
              (step === 1 && mode === "trip" && !routeId) ||
              (step === 2 && !!bookingScheduleError(date, time))
            }
          >
            {t("next")}
          </GoldButton>
        )}
      </div>
    </div>
  );
}
