import { z } from "zod";
import { ROUTE_IDS, type RouteId, getRoute } from "@/lib/routes";
import { VEHICLES, VEHICLE_IDS, type VehicleId } from "@/lib/vehicles";
import { config } from "@/lib/config";
import { addCalendarDays, bookingClock, bookingScheduleError } from "@/lib/bookingDate";

export const SERVICE_MODES = ["trip", "hours"] as const;
export type ServiceMode = (typeof SERVICE_MODES)[number];

export const DIRECTIONS = ["from", "to"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const BOOKING_STEPS = [1, 2, 3, 4, 5] as const;
export type BookingStep = (typeof BOOKING_STEPS)[number];

const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

export const bookingSchema = z
  .object({
    mode: z.enum(SERVICE_MODES),
    direction: z.enum(DIRECTIONS),
    routeId: z.enum(ROUTE_IDS).nullable(),
    customDestination: z.string().optional(),
    date: z.string().min(1),
    time: z.string().min(1),
    vehicleId: z.enum(VEHICLE_IDS),
    passengers: z.number().int().min(1).max(14),
    luggage: z.number().int().min(0).max(20),
    hours: z.number().int().min(1).max(12).optional(),
    hotelPickup: z.string().min(1),
    otherAddress: z.string().optional(),
    flightNumber: z.string().optional(),
    name: z.string().min(1),
    whatsapp: z.string().regex(PHONE_REGEX),
    email: z.string().email().optional().or(z.literal("")),
    notes: z.string().optional(),
    honeypot: z.string().optional(),
    // Client-generated key so that retrying the same submission (double tap, flaky
    // network, resubmit after an error) resolves to the booking it already created
    // instead of inserting a duplicate. Optional: the API still accepts keyless posts.
    idempotencyKey: z.string().trim().min(8).max(128).optional(),
    consent: z.literal(true),
  })
  .superRefine((data, ctx) => {
    const route = data.mode === "trip" && data.routeId ? getRoute(data.routeId) : undefined;
    const internal = route?.internal;

    if (data.mode === "trip" && !route) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "required_field",
        path: ["routeId"],
      });
    }

    if (internal) {
      if (!data.otherAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "required_field",
          path: ["otherAddress"],
        });
      }
    } else if (route?.kind === "airport") {
      if (!data.flightNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "required_for_airport",
          path: ["flightNumber"],
        });
      }
    } else if (data.mode === "trip" && data.direction === "to") {
      if (!data.otherAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "required_field",
          path: ["otherAddress"],
        });
      }
    }

    if (data.mode === "trip" && data.routeId === "varadero-airport" && !data.flightNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "required_for_airport",
        path: ["flightNumber"],
      });
    }

    const vehicle = VEHICLES[data.vehicleId];
    for (const field of ["passengers", "luggage"] as const) {
      if (data[field] > vehicle[field]) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "vehicle_capacity", path: [field] });
      }
    }

    const scheduleError = bookingScheduleError(data.date, data.time);
    if (scheduleError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: scheduleError,
        path: ["date"],
      });
    }
  });

export type BookingData = z.infer<typeof bookingSchema>;

export interface BookingState {
  step: BookingStep;
  mode: ServiceMode;
  direction: Direction;
  routeId: RouteId | null;
  customDestination: string;
  date: string;
  time: string;
  vehicleId: VehicleId;
  passengers: number;
  luggage: number;
  hours: number;
  hotelPickup: string;
  otherAddress: string;
  flightNumber: string;
  name: string;
  whatsapp: string;
  email: string;
  notes: string;
  consent: boolean;
}

export function getDefaultDate(now = new Date()): string {
  return addCalendarDays(bookingClock(now).date, 1);
}

export function getInitialState(): BookingState {
  return {
    step: 1,
    mode: "trip",
    direction: "from",
    routeId: null,
    customDestination: "",
    date: getDefaultDate(),
    time: config.booking.defaultTime,
    vehicleId: "sedan",
    passengers: 1,
    luggage: 1,
    hours: 1,
    hotelPickup: "",
    otherAddress: "",
    flightNumber: "",
    name: "",
    whatsapp: "",
    email: "",
    notes: "",
    consent: false,
  };
}
