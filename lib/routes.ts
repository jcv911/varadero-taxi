import type { VehicleId } from "./vehicles";

export const ZONE_IDS = [
  "varadero",
  "varadero-center",
  "vra-airport",
  "havana",
  "matanzas",
  "cardenas",
] as const;
export type ZoneId = (typeof ZONE_IDS)[number];

export const ROUTE_IDS = [
  "varadero-airport",
  "varadero-havana",
  "varadero-matanzas",
  "varadero-cardenas",
  "varadero-city",
] as const;
export type RouteId = (typeof ROUTE_IDS)[number];

export type RouteKind = "transfer" | "airport" | "excursion";

export interface Route {
  id: RouteId;
  kind: RouteKind;
  from: ZoneId;
  to: ZoneId;
  internal?: boolean;
  match?: string[];
  minutes: number;
  priceUsd: Record<VehicleId, number>;
}

export const ROUTES: Route[] = [
  {
    id: "varadero-airport",
    kind: "airport",
    from: "varadero",
    to: "vra-airport",
    match: ["airport", "vra", "gualberto", "juan gualberto"],
    minutes: 25,
    priceUsd: { sedan: 40, suv: 40, minivan: 50, van: 70 },
  },
  {
    id: "varadero-havana",
    kind: "transfer",
    from: "varadero",
    to: "havana",
    match: ["havana", "habana", "lahavana", "lahabana"],
    minutes: 110,
    priceUsd: { sedan: 100, suv: 115, minivan: 135, van: 165 },
  },
  {
    id: "varadero-matanzas",
    kind: "transfer",
    from: "varadero",
    to: "matanzas",
    match: ["matanzas"],
    minutes: 40,
    priceUsd: { sedan: 45, suv: 60, minivan: 75, van: 95 },
  },
  {
    id: "varadero-cardenas",
    kind: "transfer",
    from: "varadero",
    to: "cardenas",
    match: ["cardenas"],
    minutes: 30,
    priceUsd: { sedan: 35, suv: 45, minivan: 55, van: 75 },
  },
  {
    id: "varadero-city",
    kind: "transfer",
    from: "varadero",
    to: "varadero-center",
    internal: true,
    match: ["varadero", "centro de varadero", "cityvaradero"],
    minutes: 15,
    priceUsd: { sedan: 15, suv: 20, minivan: 25, van: 35 },
  },
];

export function getRoute(id: RouteId): Route | undefined {
  return ROUTES.find((r) => r.id === id);
}

export function isRouteInternal(route: Route | undefined): boolean {
  return !!route?.internal;
}

export function getRoutePrice(
  routeId: RouteId,
  vehicleId: VehicleId
): number {
  return getRoute(routeId)?.priceUsd[vehicleId] ?? 0;
}

export function getMinRoutePrice(vehicleId: VehicleId): number {
  return Math.min(...ROUTES.map((r) => r.priceUsd[vehicleId]));
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}