import type { BookingState } from "@/lib/schemas";

let pending: Partial<BookingState> | null = null;

export function setPendingDeepLink(patch: Partial<BookingState>) {
  pending = patch;
}

export function consumePendingDeepLink(): Partial<BookingState> | null {
  const patch = pending;
  pending = null;
  return patch;
}