/**
 * Error classification for writes to `bookings`.
 *
 * An insert can hit two different unique constraints and they mean opposite things:
 * a `ref` collision is ours to redraw, while an `idempotency_key` collision means the
 * booking already exists and the caller is retrying the same submission. PostgREST only
 * reports the constraint name in the error text, so the discrimination lives here — a
 * misclassification would turn a harmless retry into a lost booking or a duplicate.
 *
 * Pure module, covered by scripts/test-booking.cjs.
 */

/** Postgres error code for a unique constraint violation. */
export const UNIQUE_VIOLATION = "23505";

/** Postgres `undefined_column` and PostgREST's schema-cache equivalent. */
const UNDEFINED_COLUMN = ["42703", "PGRST204"];

/** Postgres `undefined_table` and PostgREST's schema-cache equivalent. */
const UNDEFINED_TABLE = ["42P01", "PGRST205"];

/** Shape of the errors the Supabase client returns (structural, so no dependency on its types). */
export interface PostgrestErrorLike {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

export type UniqueViolation = "ref" | "idempotency";

function errorText(error: PostgrestErrorLike): string {
  return `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
}

/**
 * Which unique constraint the insert collided with, or null when the error is something
 * else. Names come from Postgres (`bookings_ref_key`) or from the `Key (ref)=(VT-1234)
 * already exists.` detail line, so both are inspected.
 */
export function uniqueViolationTarget(
  error: PostgrestErrorLike | null | undefined
): UniqueViolation | null {
  if (error?.code !== UNIQUE_VIOLATION) return null;
  const text = errorText(error);
  if (text.includes("idempotency_key")) return "idempotency";
  if (text.includes("ref")) return "ref";
  return null;
}

/**
 * True when the insert failed because `bookings.idempotency_key` does not exist yet
 * (migration 003 not applied). The route then retries without that column instead of
 * returning 500 to every visitor.
 */
export function isMissingIdempotencyColumn(
  error: PostgrestErrorLike | null | undefined
): boolean {
  if (!error) return false;
  return UNDEFINED_COLUMN.includes(error.code ?? "") && errorText(error).includes("idempotency_key");
}

/**
 * True when the error is "that table does not exist", i.e. the migrations were never
 * applied to this database. Separate from a missing column: a missing table means no
 * booking can be written at all, a missing column only means no idempotency.
 */
export function isMissingTable(
  error: PostgrestErrorLike | null | undefined,
  table = "bookings"
): boolean {
  if (!error) return false;
  return UNDEFINED_TABLE.includes(error.code ?? "") && errorText(error).includes(table);
}
