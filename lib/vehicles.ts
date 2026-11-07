export const VEHICLE_IDS = ["sedan", "suv", "minivan", "van"] as const;
export type VehicleId = (typeof VEHICLE_IDS)[number];

export interface Vehicle {
  id: VehicleId;
  name: string;
  passengers: number;
  luggage: number;
  hourlyUsd: number;
  image: string;
  thumbPosition?: string;
}

export const VEHICLES: Record<VehicleId, Vehicle> = {
  sedan: {
    id: "sedan",
    name: "Sedán",
    passengers: 3,
    luggage: 2,
    hourlyUsd: 20,
    image: "/fleet/sedan-blanco.jpg",
  },
  suv: {
    id: "suv",
    name: "SUV",
    passengers: 4,
    luggage: 3,
    hourlyUsd: 28,
    image: "/fleet/suv-blanco.jpg",
  },
  minivan: {
    id: "minivan",
    name: "Minivan",
    passengers: 6,
    luggage: 5,
    hourlyUsd: 36,
    image: "/fleet/minivan.jpg",
  },
  van: {
    id: "van",
    name: "Van",
    passengers: 14,
    luggage: 10,
    hourlyUsd: 48,
    image: "/fleet/van.jpg",
  },
};

export const VEHICLE_LIST: Vehicle[] = VEHICLE_IDS.map((id) => VEHICLES[id]);