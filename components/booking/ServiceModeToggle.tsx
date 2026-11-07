"use client";

import { useTranslations } from "next-intl";
import { useBookingStore } from "@/lib/bookingStore";
import { SERVICE_MODES, type ServiceMode } from "@/lib/schemas";
import { cn } from "@/lib/cn";

export function ServiceModeToggle() {
  const t = useTranslations("booking");
  const mode = useBookingStore((s) => s.mode);
  const update = useBookingStore((s) => s.update);

  return (
    <div
      role="radiogroup"
      aria-label={t("mode_label")}
      className="flex gap-1 rounded-btn bg-elevated p-1"
    >
      {SERVICE_MODES.map((m: ServiceMode) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => update({ mode: m })}
          className={cn(
            "relative min-h-[44px] flex-1 rounded-[8px] px-4 text-sm font-medium transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
            mode === m ? "text-deep" : "text-muted hover:text-cream"
          )}
        >
          {mode === m && (
            <span
              aria-hidden
              className="absolute inset-0 -z-0 rounded-[8px] bg-gold transition-all duration-200"
              style={{ transitionTimingFunction: "var(--ease-lux)" }}
            />
          )}
          <span className="relative z-10">{m === "trip" ? t("mode_trip") : t("mode_hours")}</span>
        </button>
      ))}
    </div>
  );
}