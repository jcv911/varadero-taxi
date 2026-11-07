"use client";

import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { useBookingStore } from "@/lib/bookingStore";

export function HoursPicker() {
  const t = useTranslations("booking");
  const hours = useBookingStore((s) => s.hours);
  const update = useBookingStore((s) => s.update);

  function onChange(value: number) {
    update({ hours: Math.min(12, Math.max(1, value)) });
  }

  return (
    <div className="flex items-center gap-4">
      <p className="text-sm font-medium text-cream">{t("hours_count")}</p>
      <div className="flex min-h-11 items-center gap-3 rounded-btn border border-gold-line bg-elevated/50 px-3">
        <button
          type="button"
          aria-label="−"
          onClick={() => onChange(hours - 1)}
          disabled={hours <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-btn text-muted outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-30 hover:bg-deep hover:text-gold"
        >
          <Minus aria-hidden className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <span className="min-w-10 text-center text-lg font-bold tabular-nums text-gold">
          {hours}
        </span>
        <button
          type="button"
          aria-label="+"
          onClick={() => onChange(hours + 1)}
          disabled={hours >= 12}
          className="flex h-9 w-9 items-center justify-center rounded-btn text-muted outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-30 hover:bg-deep hover:text-gold"
        >
          <Plus aria-hidden className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}