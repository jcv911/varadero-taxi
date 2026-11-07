"use client";

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { getRoute, formatUsd } from "@/lib/routes";
import { VEHICLES } from "@/lib/vehicles";
import { journeyLabel } from "@/lib/journey";
import type { Direction, ServiceMode } from "@/lib/schemas";
import { formatBookingDate } from "@/lib/bookingDate";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { GoldButton } from "@/components/ui/GoldButton";

export function BookingSuccess({
  ref,
  priceUsd,
  booking,
  onNew,
}: {
  ref: string;
  priceUsd: number;
  booking: {
    mode: ServiceMode;
    hours?: number;
    routeId: string | null;
    direction: Direction;
    customDestination?: string;
    vehicleId: keyof typeof VEHICLES;
    date: string;
    time: string;
    passengers: number;
    luggage: number;
    hotelPickup: string;
    otherAddress?: string;
  } | null;
  onNew: () => void;
}) {
  const t = useTranslations("booking");
  const ts = useTranslations("success");
  const tz = useTranslations("zones");
  const tv = useTranslations("vehicles");
  const locale = useLocale();
  const route = booking?.routeId ? getRoute(booking.routeId as Parameters<typeof getRoute>[0]) : null;

  const journey =
    booking?.mode === "hours" ? `${booking.hours ?? 1} h` : route && booking
      ? journeyLabel(booking.direction, route, (z) => tz(z))
      : booking?.customDestination ?? "";

  const summaryText = booking
    ? [
        `${t("your_reservation")}: ${ref}`,
        journey,
        booking.hotelPickup ? `${booking.hotelPickup}` : "",
        booking.otherAddress ? `${booking.otherAddress}` : "",
        ts("pending"),
        `${tv(booking.vehicleId)} · ${formatBookingDate(booking.date, locale)} · ${t("time_cuba")}: ${booking.time}`,
        `${booking.passengers} ${t("pax_label")} · ${booking.luggage} ${t("bags_label")}`,
        `${formatUsd(priceUsd)}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex max-h-[92dvh] w-full max-w-md flex-col items-center gap-6 overflow-y-auto overscroll-contain rounded-card border border-gold-line bg-base/90 p-6 text-center backdrop-blur-glass sm:p-8"
    >
      <div className="relative">
        <div className="absolute -inset-3 rounded-full bg-gold/20 blur-xl" />
        <svg viewBox="0 0 24 24" className="relative h-16 w-16" aria-hidden>
          <motion.circle
            cx="12"
            cy="12"
            r="11"
            fill="none"
            stroke="var(--color-gold-line-strong)"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <motion.path
            d="M5 13l4 4L19 7"
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
      </div>

      <div>
        <h2 className="font-display text-2xl text-cream">{ts("title")}</h2>
        <p className="mt-2 text-sm text-muted">{ts("pending")}</p>
        <p className="mt-2 flex items-center justify-center gap-2 text-gold">
          <Check aria-hidden className="h-4 w-4" strokeWidth={2} />
          <span className="font-semibold tabular-nums">{ref}</span>
        </p>
      </div>

      {booking && (
        <dl className="w-full space-y-1 rounded-card border border-gold-line bg-elevated/40 p-4 text-left text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("date")}</dt>
            <dd className="tabular-nums text-cream">{formatBookingDate(booking.date, locale)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("time_cuba")}</dt>
            <dd className="tabular-nums text-cream">{booking.time}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t(booking.mode === "hours" ? "review_hours" : "mode_trip")}</dt>
            <dd className="text-right text-cream">
              {journey}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("vehicle_class")}</dt>
            <dd className="text-cream">{tv(booking.vehicleId)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("total")}</dt>
            <dd className="font-semibold tabular-nums text-gold">
              {formatUsd(priceUsd)}
            </dd>
          </div>
        </dl>
      )}

      <p className="text-sm text-muted">{t("pay_cash")}</p>

      <div className="flex w-full flex-col gap-2">
        <a
          href={buildWhatsAppLink(summaryText)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-btn border border-gold-line-strong px-6 text-sm font-semibold text-gold outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold hover:border-gold-line-strong hover:bg-gold/10"
        >
          {ts("send_whatsapp")}
        </a>
        <GoldButton onClick={onNew} className="w-full">
          {ts("new_booking")}
        </GoldButton>
      </div>
    </motion.div>
  );
}
