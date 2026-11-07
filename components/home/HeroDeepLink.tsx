"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { VEHICLE_IDS, type VehicleId } from "@/lib/vehicles";
import { ROUTES, type RouteId } from "@/lib/routes";
import { setPendingDeepLink } from "@/lib/deepLink";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function HeroDeepLink() {
  const params = useSearchParams();

  useEffect(() => {
    const vehicle = params.get("vehicle");
    const to = params.get("to");

    const patch: {
      vehicleId?: VehicleId;
      routeId?: RouteId;
    } = {};

    if (vehicle && VEHICLE_IDS.includes(vehicle as VehicleId)) {
      patch.vehicleId = vehicle as VehicleId;
    }

    if (to) {
      const needle = slugify(to);
      const route = ROUTES.find(
        (r) =>
          slugify(r.id).includes(needle) ||
          (r.match ?? []).some((m) => slugify(m).includes(needle))
      );
      if (route) patch.routeId = route.id;
    }

    if (Object.keys(patch).length > 0) {
      setPendingDeepLink(patch);
    }
  }, [params]);

  return null;
}