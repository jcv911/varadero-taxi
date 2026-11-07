import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getRoutePrice } from "@/lib/routes";
import { VEHICLES } from "@/lib/vehicles";
import { getInitialState, type BookingState } from "@/lib/schemas";

export interface BookingStore extends BookingState {
  setStep: (step: BookingState["step"]) => void;
  update: (patch: Partial<BookingState>) => void;
  reset: () => void;
  resetAfterBooking: () => void;
}

export type PersistedBooking = Pick<BookingState, "name" | "whatsapp" | "email">;

function isPersistedBooking(value: unknown): value is Partial<PersistedBooking> {
  if (!value || typeof value !== "object") return false;
  return true;
}

export const useBookingStore = create<BookingStore>()(
  persist(
    (set) => ({
      ...getInitialState(),
      setStep: (step) => set({ step }),
      update: (patch) => set((state) => {
        const vehicle = VEHICLES[patch.vehicleId ?? state.vehicleId];
        return {
          ...patch,
          passengers: Math.min(vehicle.passengers, Math.max(1, patch.passengers ?? state.passengers)),
          luggage: Math.min(vehicle.luggage, Math.max(0, patch.luggage ?? state.luggage)),
        };
      }),
      reset: () => set(getInitialState()),
      resetAfterBooking: () =>
        set((s) => {
          const base = getInitialState();
          return {
            ...base,
            name: s.name,
            whatsapp: s.whatsapp,
            email: s.email,
          };
        }),
    }),
    {
      name: "varadero-booking",
      // v2: drops the persisted `mode` and `vehicleId` so the form always opens
      // on the sedan. Without a version bump, existing localStorage would keep
      // rehydrating the stale vehicle (partialize only governs writes, not reads).
      version: 2,
      skipHydration: true,
      partialize: (state) => {
        // vehicleId and mode are deliberately NOT persisted: a returning visitor
        // must start on the sedan (cheapest) rather than the last vehicle they
        // happened to tap. Business decision 2026-09-25.
        const { name, whatsapp, email } = state;
        return { name, whatsapp, email };
      },
      migrate: (persisted) => {
        if (!isPersistedBooking(persisted)) return getInitialState();
        const base = getInitialState();
        return {
          ...base,
          name: persisted.name ?? base.name,
          whatsapp: persisted.whatsapp ?? base.whatsapp,
          email: persisted.email ?? base.email,
        };
      },
    }
  )
);

export function computePrice(
  input: Pick<BookingState, "mode" | "hours" | "routeId" | "vehicleId">
): number {
  if (input.mode === "hours") {
    return input.hours * VEHICLES[input.vehicleId].hourlyUsd;
  }
  if (!input.routeId) return 0;
  return getRoutePrice(input.routeId, input.vehicleId);
}

export const selectPrice = (state: BookingStore): number =>
  computePrice(state);

export function bookingToAPI(state: BookingState) {
  return {
    mode: state.mode,
    direction: state.direction,
    routeId: state.mode === "trip" ? state.routeId : null,
    customDestination: state.mode === "trip" ? state.customDestination || undefined : undefined,
    date: state.date,
    time: state.time,
    vehicleId: state.vehicleId,
    passengers: state.passengers,
    luggage: state.luggage,
    hours: state.mode === "hours" ? state.hours : undefined,
    hotelPickup: state.hotelPickup,
    otherAddress: state.otherAddress || undefined,
    flightNumber: state.flightNumber || undefined,
    name: state.name,
    whatsapp: state.whatsapp,
    email: state.email || undefined,
    notes: state.notes || undefined,
    consent: state.consent,
  };
}
