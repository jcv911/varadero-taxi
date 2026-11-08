import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/schemas";
import { computePrice } from "@/lib/bookingStore";
import { getRoute } from "@/lib/routes";
import { VEHICLES } from "@/lib/vehicles";
import { config } from "@/lib/config";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isMissingIdempotencyColumn, uniqueViolationTarget } from "@/lib/supabase/errors";

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
/** Draws of a ref before giving up. Collisions are resolved by the unique index, not by a lookup. */
const REF_ATTEMPTS = 5;
const IDEMPOTENCY_BACKOFF_MS = 5 * 60_000;

const hits = new Map<string, number[]>();

type SupabaseServer = ReturnType<typeof createSupabaseServer>;

const BOOKING_COLUMNS =
  "ref, mode, direction, route_id, custom_destination, vehicle_id, date, time, price_usd, name, whatsapp, hotel_pickup, other_address, flight_number, passengers, luggage, notes";

/**
 * `bookings.idempotency_key` arrives with migration 003. Between a code deploy and that
 * migration being applied, sending the column would fail EVERY insert (42703 / PGRST204),
 * so after the first occurrence the column is left out for a few minutes: the site keeps
 * taking bookings instead of returning 500 to every visitor until someone notices.
 */
let idempotencyColumnBackoffUntil = 0;

function getClientIp(request: Request): string {
  // El cliente puede enviar cualquier valor en x-forwarded-for. El proxy de Railway añade la
  // IP real al FINAL de la cadena, así que se toma el último valor, no el primero.
  const fwd = request.headers.get("x-forwarded-for");
  const parts = fwd?.split(",").map((p) => p.trim()).filter(Boolean) ?? [];
  return parts[parts.length - 1] ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function generateRef(): string {
  // 6 caracteres de un alfabeto sin ambigüedades (sin 0/O, 1/I): ~1.000 millones de combinaciones.
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${config.booking.refPrefix}${code}`;
}

/** Escapa lo que Telegram interpreta como HTML (parse_mode "HTML"). */
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Best-effort admin notification. Disabled by business decision (2026-09-25): the
 * booking panel is the channel, Telegram is optional and stays off until its env vars
 * are set. Early-return keeps it inert when unconfigured, and the no-op catch means a
 * notification failure can never take down an already-saved booking.
 */
async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // no-op, never block response on notification failure
  }
}

function adminMessage(row: {
  ref: string;
  mode: string;
  direction: string;
  route_id: string | null;
  custom_destination: string | null;
  vehicle_id: string;
  date: string;
  time: string;
  price_usd: number;
  name: string;
  whatsapp: string;
  hotel_pickup: string;
  other_address: string | null;
  flight_number: string | null;
  passengers: number;
  luggage: number;
  notes: string | null;
}): string {
  const ZONE_LABELS: Record<string, string> = {
    varadero: "Varadero",
    "varadero-center": "Centro de Varadero",
    "vra-airport": "Aeropuerto Juan Gualberto Gómez (VRA)",
    havana: "La Habana",
    matanzas: "Matanzas",
    cardenas: "Cárdenas",
  };
  const route = row.route_id ? getRoute(row.route_id as Parameters<typeof getRoute>[0]) : null;
  const vehicle = VEHICLES[row.vehicle_id as keyof typeof VEHICLES]?.name ?? row.vehicle_id;

  let trip: string;
  if (row.mode === "hours") {
    trip = "Servicio por horas";
  } else if (row.direction === "to" && route) {
    trip = `${ZONE_LABELS[route.to] ?? route.to} → ${ZONE_LABELS[route.from] ?? route.from}`;
  } else if (route) {
    trip = `${ZONE_LABELS[route.from] ?? route.from} → ${ZONE_LABELS[route.to] ?? route.to}`;
  } else {
    trip = row.custom_destination ?? "—";
  }

  const e = escapeHtml;
  return [
    `<b>Nueva reserva ${e(row.ref)}</b>`,
    `Trayecto: ${e(trip)}`,
    `Vehículo: ${e(vehicle)}`,
    `Fecha/hora: ${e(row.date)} ${e(row.time)}`,
    `Precio: ${row.price_usd} USD`,
    `${row.passengers} pax · ${row.luggage} maletas`,
    `Punto en Varadero: ${e(row.hotel_pickup)}`,
    row.other_address ? `Otro punto: ${e(row.other_address)}` : null,
    row.flight_number ? `Vuelo: ${e(row.flight_number)}` : null,
    `Nombre: ${e(row.name)}`,
    `Tel: ${e(row.whatsapp)}`,
    row.notes ? `Nota: ${e(row.notes)}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

async function findByIdempotencyKey(supabase: SupabaseServer, key: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .eq("idempotency_key", key)
    .maybeSingle();

  if (error || !data) {
    console.error("[bookings] the row owning this idempotency key could not be read", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
    });
    return null;
  }
  return data;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.honeypot && data.honeypot.trim().length > 0) {
    return NextResponse.json({ error: "honeypot" }, { status: 403 });
  }

  const priceUsd = computePrice({
    mode: data.mode,
    hours: data.hours ?? 1,
    routeId: data.routeId,
    vehicleId: data.vehicleId,
  });

  let supabase: SupabaseServer;
  try {
    supabase = createSupabaseServer();
  } catch (error) {
    // Previously an unhandled throw: the client saw a 500 and the logs said nothing.
    console.error(
      "[bookings] storage is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
      error
    );
    return NextResponse.json({ error: "server_misconfigured" }, { status: 503 });
  }

  const idempotencyKey = data.idempotencyKey ?? null;

  const booking = {
    status: "pendiente",
    mode: data.mode,
    direction: data.direction,
    route_id: data.routeId,
    custom_destination: data.customDestination || null,
    vehicle_id: data.vehicleId,
    date: data.date,
    time: data.time,
    hours: data.mode === "hours" ? data.hours ?? null : null,
    price_usd: priceUsd,
    name: data.name,
    whatsapp: data.whatsapp,
    email: data.email || null,
    hotel_pickup: data.hotelPickup,
    other_address: data.otherAddress || null,
    flight_number: data.flightNumber || null,
    passengers: data.passengers,
    luggage: data.luggage,
    notes: data.notes || null,
  };

  for (let attempt = 1; attempt <= REF_ATTEMPTS; attempt++) {
    // The ref is drawn here and settled by the unique index: if two requests pick the same
    // one, the loser gets 23505 and draws again. The previous version pre-checked with a
    // SELECT and then inserted, which left a race window that failed real bookings with 500.
    const ref = generateRef();
    // Re-read inside the loop: a missing-column failure below sets the backoff and the
    // immediate retry must already leave the column out, or all 5 attempts would fail.
    const sendIdempotencyKey =
      Boolean(idempotencyKey) && Date.now() >= idempotencyColumnBackoffUntil;
    const { data: created, error } = await supabase
      .from("bookings")
      .insert({
        ...booking,
        ref,
        ...(sendIdempotencyKey ? { idempotency_key: idempotencyKey } : {}),
      })
      .select(BOOKING_COLUMNS)
      .single();

    if (created && !error) {
      void notifyTelegram(adminMessage(created));
      return NextResponse.json({ ref: created.ref, priceUsd: Number(created.price_usd) });
    }

    if (isMissingIdempotencyColumn(error)) {
      idempotencyColumnBackoffUntil = Date.now() + IDEMPOTENCY_BACKOFF_MS;
      console.warn(
        "[bookings] bookings.idempotency_key is missing — apply supabase/migrations/003_booking_idempotency.sql; accepting requests without the key for now"
      );
      continue;
    }

    const conflict = uniqueViolationTarget(error);

    if (conflict === "idempotency" && idempotencyKey) {
      const existing = await findByIdempotencyKey(supabase, idempotencyKey);
      if (existing) {
        console.info("[bookings] duplicate submission ignored", { ref: existing.ref });
        return NextResponse.json({
          ref: existing.ref,
          priceUsd: Number(existing.price_usd),
          duplicate: true,
        });
      }
      return NextResponse.json({ error: "idempotency_lookup_failed" }, { status: 500 });
    }

    if (conflict === "ref") {
      console.warn(`[bookings] ref ${ref} already taken, retrying (${attempt}/${REF_ATTEMPTS})`);
      continue;
    }

    console.error("[bookings] insert failed", {
      ref,
      attempt,
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  console.error(`[bookings] no free ref after ${REF_ATTEMPTS} attempts`);
  return NextResponse.json({ error: "ref_generation" }, { status: 500 });
}
