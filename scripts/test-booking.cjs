// Runs against the real TypeScript modules without emitted files or extra deps.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} };
  cache.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const resolve = (id) => id.startsWith("@/")
    ? load(path.join(root, `${id.slice(2)}.ts`)) : require(id);
  new Function("require", "module", "exports", code)(resolve, mod, mod.exports);
  return mod.exports;
}
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.window = { localStorage: global.localStorage };
const dates = load(path.join(root, "lib/bookingDate.ts"));
const { bookingSchema, getInitialState, getDefaultDate } = load(path.join(root, "lib/schemas.ts"));
const { useBookingStore, bookingToAPI, computePrice } = load(path.join(root, "lib/bookingStore.ts"));
const { VEHICLE_LIST } = load(path.join(root, "lib/vehicles.ts"));
const { ROUTES } = load(path.join(root, "lib/routes.ts"));

for (const zone of ["UTC", "America/Havana", "Asia/Tokyo", "Pacific/Honolulu"]) {
  process.env.TZ = zone;
  assert.equal(getDefaultDate(new Date("2026-09-21T01:30:00Z")), "2026-09-21", zone);
  assert.equal(dates.formatBookingDate("2026-09-25", "en"), "Sep 25, 2026", zone);
  assert.equal(dates.bookingInstant("2026-09-25", "10:00").toISOString(), "2026-09-25T14:00:00.000Z", zone);
  assert.equal(dates.bookingInstant("2026-01-25", "10:00").toISOString(), "2026-01-25T15:00:00.000Z", zone);
}
assert.equal(dates.addCalendarDays("2026-12-31", 1), "2027-01-01");
assert.equal(dates.calendarDate("2026-02-30"), null);
assert.equal(dates.bookingInstant("2026-03-08", "00:30"), null);
assert.equal(dates.bookingScheduleError("2026-09-21", "10:00", new Date("2026-09-21T13:00:00Z")), "date_too_soon");
assert.equal(dates.bookingScheduleError("2026-09-21", "12:00", new Date("2026-09-21T13:00:00Z")), null);

const base = { ...getInitialState(), routeId: ROUTES[0].id, date: dates.addCalendarDays(dates.bookingClock().date, 2), name: "Test", whatsapp: "+12025550199", hotelPickup: "Test", otherAddress: "Test", flightNumber: "TEST", consent: true };
for (const vehicle of VEHICLE_LIST) {
  const payload = { ...base, vehicleId: vehicle.id, passengers: vehicle.passengers, luggage: vehicle.luggage };
  assert.equal(bookingSchema.safeParse(payload).success, true, vehicle.id);
  assert.equal(bookingSchema.safeParse({ ...payload, passengers: vehicle.passengers + 1 }).success, false);
  assert.equal(bookingSchema.safeParse({ ...payload, luggage: vehicle.luggage + 1 }).success, false);
  for (const route of ROUTES) assert.equal(computePrice({ ...payload, routeId: route.id }), route.priceUsd[vehicle.id]);
  assert.equal(computePrice({ ...payload, mode: "hours", hours: 3 }), vehicle.hourlyUsd * 3);
}
assert.equal(bookingSchema.safeParse({ ...base, routeId: null, customDestination: "Trinidad" }).success, false);
assert.equal(bookingSchema.safeParse({ ...base, mode: "hours", routeId: null, direction: "to", otherAddress: "", flightNumber: "" }).success, true);
assert.equal(bookingSchema.safeParse({ ...base, mode: "hours", routeId: "varadero-airport", direction: "to", otherAddress: "", flightNumber: "" }).success, true);
useBookingStore.getState().update({ vehicleId: "van", passengers: 14, luggage: 10 });
useBookingStore.getState().update({ vehicleId: "sedan" });
assert.equal(useBookingStore.getState().passengers, 3);
assert.equal(useBookingStore.getState().luggage, 2);
assert.equal(bookingToAPI({ ...base, mode: "hours" }).routeId, null);

// Clave de idempotencia: opcional, se recorta antes de medir y no rompe los envíos sin ella.
assert.equal(bookingSchema.safeParse({ ...base, idempotencyKey: "a1b2c3d4" }).success, true);
assert.equal(bookingSchema.safeParse({ ...base, idempotencyKey: "  12345678  " }).success, true);
assert.equal(bookingSchema.safeParse({ ...base, idempotencyKey: "corta" }).success, false);
assert.equal(bookingSchema.safeParse({ ...base, idempotencyKey: "x".repeat(129) }).success, false);
assert.equal(bookingSchema.safeParse(base).success, true);

// Clasificación de errores de Postgres: de ella depende reintentar la ref o devolver la
// reserva que ya existe. Confundirlas duplicaría reservas o perdería peticiones válidas.
const { uniqueViolationTarget, isMissingIdempotencyColumn, isMissingTable } = load(path.join(root, "lib/supabase/errors.ts"));
const pgError = (code, message, details = "") => ({ code, message, details });
assert.equal(
  uniqueViolationTarget(pgError("23505", 'duplicate key value violates unique constraint "bookings_ref_key"', "Key (ref)=(VT-1234) already exists.")),
  "ref"
);
assert.equal(
  uniqueViolationTarget(pgError("23505", 'duplicate key value violates unique constraint "bookings_idempotency_key_key"', "Key (idempotency_key)=(e2e-abc) already exists.")),
  "idempotency"
);
assert.equal(uniqueViolationTarget(pgError("23503", 'violates foreign key constraint "bookings_vehicle_id_fkey"')), null);
assert.equal(uniqueViolationTarget(null), null);
assert.equal(isMissingIdempotencyColumn(pgError("PGRST204", "Could not find the 'idempotency_key' column of 'bookings' in the schema cache")), true);
// Mensajes copiados de respuestas REALES de PostgREST de este proyecto, no inventados:
// `column bookings.x does not exist` (42703) y `Could not find the table 'public.x' …` (PGRST205).
assert.equal(isMissingIdempotencyColumn(pgError("42703", "column bookings.idempotency_key does not exist")), true);
assert.equal(isMissingIdempotencyColumn(pgError("PGRST204", "Could not find the 'notes' column of 'bookings' in the schema cache")), false);
assert.equal(isMissingIdempotencyColumn(pgError("23505", 'duplicate key value violates unique constraint "bookings_idempotency_key_key"')), false);

// Tabla ausente (migraciones nunca aplicadas) es un desajuste DISTINTO de columna ausente:
// lo primero impide escribir cualquier reserva, lo segundo solo quita la idempotencia.
assert.equal(isMissingTable(pgError("PGRST205", "Could not find the table 'public.bookings' in the schema cache")), true);
assert.equal(isMissingTable(pgError("42P01", 'relation "public.bookings" does not exist')), true);
assert.equal(isMissingTable(pgError("PGRST205", "Could not find the table 'public.otros' in the schema cache")), false);
assert.equal(isMissingTable(pgError("PGRST204", "Could not find the 'notes' column of 'bookings' in the schema cache")), false);
assert.equal(isMissingTable(null), false);

// Versión desplegada: de qué variable sale, con qué precedencia y qué se dice si no hay nada.
const { deploymentInfo } = load(path.join(root, "lib/version.ts"));
assert.deepEqual(deploymentInfo({}), { commit: null, commitShort: null, branch: null, environment: null, source: "unknown" });
const rw = deploymentInfo({
  RAILWAY_GIT_COMMIT_SHA: "e7ab8be0123456789abcdef0123456789abcdef0",
  RAILWAY_GIT_BRANCH: "master",
  RAILWAY_ENVIRONMENT_NAME: "production",
});
assert.equal(rw.source, "railway");
assert.equal(rw.commitShort, "e7ab8be");
assert.equal(rw.branch, "master");
assert.equal(rw.environment, "production");
// Precedencia: Railway gana a Vercel, y Vercel a las variables genéricas.
assert.equal(deploymentInfo({ RAILWAY_GIT_COMMIT_SHA: "aaa1111", VERCEL_GIT_COMMIT_SHA: "bbb2222", GIT_COMMIT: "ccc3333" }).source, "railway");
assert.equal(deploymentInfo({ VERCEL_GIT_COMMIT_SHA: "bbb2222", GIT_COMMIT: "ccc3333" }).source, "vercel");
const generic = deploymentInfo({ COMMIT_SHA: "ccc3333", GIT_BRANCH: "main" });
assert.equal(generic.source, "env");
assert.equal(generic.branch, "main");
// Un valor vacío o en blanco no cuenta como versión.
assert.equal(deploymentInfo({ RAILWAY_GIT_COMMIT_SHA: "   " }).source, "unknown");

console.log("PASS: date/time zones, invalid dates, lead time, route prices, hours, all vehicle capacities and smaller-vehicle adjustment");
console.log("PASS: idempotency key schema and Postgres error classification");
console.log("PASS: deployed revision resolution (source precedence, short commit, blank values)");
