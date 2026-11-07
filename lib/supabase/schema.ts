import type { createSupabaseServer } from "./server";
import {
  isMissingIdempotencyColumn,
  isMissingTable,
  type PostgrestErrorLike,
} from "./errors";

type SupabaseServer = ReturnType<typeof createSupabaseServer>;

/**
 * ¿Está el esquema de la base al día con el código desplegado?
 *
 * Es un desajuste distinto del que ya cubre `checks.supabase`: las variables pueden estar
 * puestas y faltar la migración 003. El código sobrevive a esa falta (deja de enviar
 * `idempotency_key`), así que sin esta comprobación el único síntoma sería una reserva
 * duplicada un día cualquiera.
 *
 * Solo se infiere: no migra nada ni escribe nada. La consulta se trae como mucho UNA fila
 * de UNA columna (`limit(1)`), que es lo que hace que PostgREST valide el nombre contra
 * su caché de esquema.
 *
 * Cuidado: `head: true` NO sirve para esto, y la diferencia no es cosmética. Comprobado
 * contra el proyecto real: con `head`, una tabla inexistente responde 204 SIN error —la
 * sonda daría "esquema al día" en una base sin migrar— y una columna inexistente responde
 * 400 con el mensaje vacío y sin código, que ningún clasificador puede leer.
 */
export interface MigrationProbe {
  /** true = columna presente · false = falta la migración 003 · null = no se pudo determinar. */
  idempotencyKey: boolean | null;
  /** Texto accionable cuando falta algo, o null si el esquema está al día. */
  warning: string | null;
}

/**
 * Un healthcheck no puede quedarse colgado: si Supabase no responde, Railway acabaría
 * tratando la instancia como no sana. La sonda se rinde y se declara "no se sabe".
 */
const PROBE_TIMEOUT_MS = 3_000;
const PROBE_TIMEOUT = "schema_probe_timeout";

async function withTimeout<T>(query: PromiseLike<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(query),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(PROBE_TIMEOUT)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function probeBookingMigrations(
  client: SupabaseServer,
  timeoutMs: number = PROBE_TIMEOUT_MS
): Promise<MigrationProbe> {
  let error: PostgrestErrorLike | null = null;

  try {
    const result = await withTimeout(
      client.from("bookings").select("idempotency_key").limit(1),
      timeoutMs
    );
    error = result.error;
  } catch (thrown) {
    const timedOut = thrown instanceof Error && thrown.message === PROBE_TIMEOUT;
    return {
      idempotencyKey: null,
      warning: timedOut
        ? `could not check the bookings schema: the probe did not answer within ${timeoutMs} ms`
        : "could not check the bookings schema: the probe query failed",
    };
  }

  if (!error) return { idempotencyKey: true, warning: null };

  if (isMissingIdempotencyColumn(error)) {
    return {
      idempotencyKey: false,
      warning:
        "bookings.idempotency_key is missing: apply supabase/migrations/003_booking_idempotency.sql, or retrying a submission can create a duplicate booking",
    };
  }

  if (isMissingTable(error)) {
    return {
      idempotencyKey: false,
      warning:
        "the bookings table does not exist: apply the migrations in supabase/migrations",
    };
  }

  // Se desconoce el motivo: se dice, en vez de afirmar que el esquema está bien.
  return {
    idempotencyKey: null,
    warning: `could not check the bookings schema (${error.code ?? "no code"}): ${error.message ?? ""}`.trim(),
  };
}
