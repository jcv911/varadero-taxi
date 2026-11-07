"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBookingStore } from "@/lib/bookingStore";
import { config } from "@/lib/config";
import { cn } from "@/lib/cn";
import { addCalendarDays, bookingClock, bookingInstant, bookingScheduleError, calendarDate, formatBookingDate } from "@/lib/bookingDate";

const HOURS = [
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "20:00",
  "22:00",
];

function toKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function DateTimePicker() {
  const t = useTranslations("booking");
  const te = useTranslations("errors");
  const locale = useLocale();
  const date = useBookingStore((s) => s.date);
  const time = useBookingStore((s) => s.time);
  const update = useBookingStore((s) => s.update);
  const scheduleError = bookingScheduleError(date, time);

  const now = useMemo(() => new Date(), []);
  const minAllowed = new Date(now.getTime() + config.booking.minLeadHours * 3600e3);
  const minKey = bookingClock(minAllowed).date;
  const maxKey = addCalendarDays(bookingClock(now).date, config.booking.maxAdvanceDays);

  const [view, setView] = useState(() => {
    const d = calendarDate(date) ?? calendarDate(minKey)!;
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
  });

  const cells = useMemo(
    () => buildMonth(view.year, view.month),
    [view.year, view.month]
  );
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { timeZone: "UTC", month: "long", year: "numeric" }).format(
        new Date(Date.UTC(view.year, view.month, 1, 12))
      ),
    [locale, view.year, view.month]
  );
  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "short" });
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(Date.UTC(2024, 5, 2 + i, 12)))
    );
  }, [locale]);

  const canStepPrev = useMemo(() => {
    const target = new Date(Date.UTC(view.year, view.month - 1, 1, 12));
    return toKey(target).slice(0, 7) >= minKey.slice(0, 7);
  }, [view.year, view.month, minKey]);

  const canStepNext = useMemo(() => {
    const target = new Date(Date.UTC(view.year, view.month + 1, 1, 12));
    return toKey(target).slice(0, 7) <= maxKey.slice(0, 7);
  }, [view.year, view.month, maxKey]);

  function stepMonth(delta: number) {
    const target = new Date(Date.UTC(view.year, view.month + delta, 1, 12));
    const monthKey = toKey(target).slice(0, 7);
    if (monthKey < minKey.slice(0, 7) || monthKey > maxKey.slice(0, 7)) return;
    setView({ year: target.getUTCFullYear(), month: target.getUTCMonth() });
  }

  function isDayDisabled(day: Date): boolean {
    const k = toKey(day);
    const lastTime = bookingInstant(k, HOURS[HOURS.length - 1]);
    return k < minKey || k > maxKey || !lastTime || lastTime < minAllowed;
  }

  function isHourDisabled(h: string): boolean {
    const instant = bookingInstant(date, h);
    return !instant || instant < minAllowed;
  }

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gold" aria-live="polite">
        {t("selected_date")}: {formatBookingDate(date, locale)}
      </p>
    <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            {t("date")}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label={t("previous_month")}
              disabled={!canStepPrev}
              onClick={() => stepMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-btn text-muted outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-25 hover:bg-elevated hover:text-cream"
            >
              <ChevronLeft aria-hidden className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              aria-label={t("next_month")}
              disabled={!canStepNext}
              onClick={() => stepMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-btn text-muted outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-25 hover:bg-elevated hover:text-cream"
            >
              <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
        <p className="mb-2 font-display text-sm capitalize text-cream">
          {monthLabel}
        </p>
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdayLabels.map((w, i) => (
            <span key={i} className="text-[10px] font-medium uppercase text-muted">
              {w}
            </span>
          ))}
          {cells.map((day, i) =>
            day === null ? (
              <span key={`e-${i}`} />
            ) : (
              <button
                key={toKey(day)}
                type="button"
                aria-label={formatBookingDate(toKey(day), locale)}
                aria-pressed={date === toKey(day)}
                disabled={isDayDisabled(day)}
                onClick={() => {
                  const nextDate = toKey(day);
                  const selectedTime = bookingInstant(nextDate, time);
                  const nextTime = selectedTime && selectedTime >= minAllowed
                    ? time
                    : HOURS.find((h) => {
                        const instant = bookingInstant(nextDate, h);
                        return instant && instant >= minAllowed;
                      }) ?? time;
                  update({ date: nextDate, time: nextTime });
                }}
                className={cn(
                  "flex h-9 w-full min-w-0 items-center justify-center rounded-btn text-sm outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-25",
                  date === toKey(day)
                    ? "bg-gold font-semibold text-deep"
                    : "text-cream hover:bg-elevated"
                )}
              >
                {day.getUTCDate()}
              </button>
            )
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
          {t("time_cuba")}
        </p>
        <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-col">
          {HOURS.map((h) => (
            <button
              key={h}
              type="button"
              aria-pressed={time === h}
              disabled={isHourDisabled(h)}
              onClick={() => {
                update({ time: h });
              }}
              className={cn(
                "shrink-0 rounded-btn px-3 py-2 text-sm tabular-nums outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-25",
                time === h
                  ? "bg-gold font-semibold text-deep"
                  : "text-cream hover:bg-elevated"
              )}
            >
              {h}
            </button>
          ))}
        </div>
      </div>
    </div>
      {scheduleError && <p role="alert" className="mt-3 text-sm text-error">{te(scheduleError)}</p>}
    </div>
  );
}

function buildMonth(year: number, month: number): (Date | null)[] {
  const first = new Date(Date.UTC(year, month, 1, 12));
  const offset = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(year, month, d, 12)));
  return cells;
}
