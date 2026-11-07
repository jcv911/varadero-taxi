import { config } from "@/lib/config";

// Booking dates and times refer to the pickup location, regardless of the
// visitor's or server's time zone. Date-only values never represent instants.
export const BOOKING_TIME_ZONE = "America/Havana";

export function bookingClock(now = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)!.value;
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}

export function calendarDate(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const date = new Date(`${key}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === key
    ? date : null;
}

export function addCalendarDays(key: string, days: number): string {
  const date = calendarDate(key);
  if (!date) return "";
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatBookingDate(key: string, locale: string): string {
  const date = calendarDate(key);
  return date ? new Intl.DateTimeFormat(locale, {
    timeZone: "UTC", day: "numeric", month: "short", year: "numeric",
  }).format(date) : key;
}

export function bookingInstant(date: string, time: string): Date | null {
  if (!calendarDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const wallTime = Date.parse(`${date}T${time}:00Z`);
  let instant = wallTime;
  // Resolve Havana's UTC offset, including daylight-saving transitions.
  for (let i = 0; i < 3; i++) {
    const clock = bookingClock(new Date(instant));
    const delta = wallTime - Date.parse(`${clock.date}T${clock.time}:00Z`);
    if (delta === 0) return new Date(instant);
    instant += delta;
  }
  return null; // A wall time skipped by the daylight-saving transition.
}

export function bookingScheduleError(date: string, time: string, now = new Date()): string | null {
  const instant = bookingInstant(date, time);
  if (!instant) return "invalid_date";
  if (instant.getTime() < now.getTime() + config.booking.minLeadHours * 3600e3) return "date_too_soon";
  if (date > addCalendarDays(bookingClock(now).date, config.booking.maxAdvanceDays)) return "date_too_far";
  return null;
}
