import type { Direction } from "@/lib/schemas";
import type { Route, ZoneId } from "@/lib/routes";

export function journeyLabel(
  direction: Direction,
  route: Route,
  zoneLabel: (zone: ZoneId) => string
): string {
  const from = zoneLabel(route.from);
  const to = zoneLabel(route.to);
  if (route.internal) return `${from} → ${to}`;
  return direction === "from" ? `${from} → ${to}` : `${to} → ${from}`;
}