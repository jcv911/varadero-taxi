import { NextResponse } from "next/server";
import { deploymentInfo } from "@/lib/version";
import { createSupabaseServer } from "@/lib/supabase/server";
import { probeBookingMigrations } from "@/lib/supabase/schema";

/**
 * Health check for Railway.
 *
 * Reports configuration state WITHOUT leaking secrets: only booleans, never values.
 * Catches the silent failure where the site serves 200 but every booking 500s
 * because SUPABASE_* env vars are missing in production.
 *
 * Also answers "which revision is live?": deploys are asynchronous, so after a push the
 * previous build keeps serving until the new one is healthy. `version.commit` (and the
 * X-Deployed-Commit header) tell you whether the commit you just pushed is actually the
 * one answering, instead of inferring it from behaviour.
 *
 * And "is the database schema in step with this code?": the env vars can be right while
 * the 003 migration is missing. The API survives that (it stops sending
 * `idempotency_key`), so without this check the only symptom would be a duplicate booking
 * one random day.
 *
 * Deliberate: schema drift does NOT change the status code. A missing migration means
 * bookings still work, only without duplicate protection — and answering 503 here would
 * make Railway's healthcheck refuse to promote the very deployment that degrades
 * gracefully, turning "works without idempotency" into "does not deploy". Drift is
 * reported through `checks.migration003` and `warnings` instead.
 */
export async function GET() {
  const checks = {
    supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    // null = todavía no se sabe (sin configurar Supabase, o sonda sin respuesta).
    migration003: null as boolean | null,
  };

  const version = deploymentInfo();
  const warnings: string[] = [];

  // Only ask about the schema when there is a database to ask. The probe can never take
  // the healthcheck down: on failure it reports "unknown" and the response carries on.
  if (checks.supabase) {
    try {
      const probe = await probeBookingMigrations(createSupabaseServer());
      checks.migration003 = probe.idempotencyKey;
      if (probe.warning) warnings.push(probe.warning);
    } catch (error) {
      console.error("[health] the bookings schema probe could not run", error);
      warnings.push("could not check the bookings schema: the probe could not run");
    }
  }

  const ok = checks.supabase;

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      checks,
      version,
      warnings: warnings.length ? warnings : undefined,
      hint: ok
        ? undefined
        : "Bookings will fail (500). Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Railway variables.",
    },
    {
      status: ok ? 200 : 503,
      headers: {
        // Sin esto, una respuesta cacheada por un proxy contestaría con el despliegue
        // ANTERIOR — exactamente la pregunta que este endpoint existe para resolver.
        "Cache-Control": "no-store, max-age=0",
        "X-Deployed-Commit": version.commitShort ?? "unknown",
      },
    }
  );
}
