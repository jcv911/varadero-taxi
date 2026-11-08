// Drives the real route handlers with a stubbed Supabase client: no network, no database.
// POST /api/bookings — the insert retry, the idempotency reply, the missing-column
// degradation and the diagnostic logging. GET /api/health — the deployed revision it
// publishes. Covers what the pure tests cannot.
//
// Run: node scripts/test-bookings-api.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.window = { localStorage: global.localStorage };

/** Replaced before each case; null simulates missing SUPABASE_* env vars. */
let stub = null;

const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} };
  cache.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const resolve = (id) => {
    if (id === "@/lib/supabase/server") {
      return {
        createSupabaseServer: () => {
          if (!stub) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
          return stub;
        },
      };
    }
    if (id.startsWith("@/")) return load(path.join(root, `${id.slice(2)}.ts`));
    if (id.startsWith(".") || id.startsWith("/")) {
      // Import relativo dentro del módulo que se está cargando (p. ej. schema.ts -> ./errors).
      // El harness solo resolvía el alias @/, así que esto era un fallo latente.
      const target = path.resolve(path.dirname(file), id);
      for (const candidate of [`${target}.ts`, path.join(target, "index.ts")]) {
        if (fs.existsSync(candidate)) return load(candidate);
      }
    }
    return require(id);
  };
  new Function("require", "module", "exports", code)(resolve, mod, mod.exports);
  return mod.exports;
}

const { POST } = load(path.join(root, "app/api/bookings/route.ts"));
const dates = load(path.join(root, "lib/bookingDate.ts"));

const ROW = {
  ref: "VT-1234",
  mode: "trip",
  direction: "from",
  route_id: "varadero-havana",
  custom_destination: null,
  vehicle_id: "sedan",
  date: "2026-10-01",
  time: "10:00",
  price_usd: 100,
  name: "Test",
  whatsapp: "+53500112233",
  hotel_pickup: "Hotel Test",
  other_address: null,
  flight_number: null,
  passengers: 1,
  luggage: 1,
  notes: null,
};

const DUP_REF = {
  code: "23505",
  message: 'duplicate key value violates unique constraint "bookings_ref_key"',
  details: "Key (ref)=(VT-1234) already exists.",
};
const DUP_KEY = {
  code: "23505",
  message: 'duplicate key value violates unique constraint "bookings_idempotency_key_key"',
  details: "Key (idempotency_key)=(abc) already exists.",
};
const NO_COLUMN = {
  code: "PGRST204",
  message: "Could not find the 'idempotency_key' column of 'bookings' in the schema cache",
};

const ok = (row = ROW) => ({ data: row, error: null });

/** `steps` are consumed in order; the last one repeats. `existing` answers lookups by key. */
function fakeSupabase(steps, existing = null) {
  const inserts = [];
  let i = 0;
  stub = {
    inserts,
    from(table) {
      assert.equal(table, "bookings");
      return {
        insert(row) {
          inserts.push(row);
          const step = steps[Math.min(i++, steps.length - 1)];
          return { select: () => ({ single: async () => step }) };
        },
        select() {
          return { eq: () => ({ maybeSingle: async () => existing ?? { data: null, error: null } }) };
        },
      };
    },
  };
  return stub;
}

let ip = 0;
function request(body) {
  return { headers: new Headers({ "x-forwarded-for": `10.0.0.${++ip}` }), json: async () => body };
}

function payload(over = {}) {
  return {
    mode: "trip",
    direction: "from",
    routeId: "varadero-havana",
    date: dates.addCalendarDays(dates.bookingClock().date, 1),
    time: "10:00",
    vehicleId: "sedan",
    passengers: 1,
    luggage: 1,
    hotelPickup: "Hotel Test",
    name: "Test",
    whatsapp: "+53500112233",
    email: "",
    notes: "",
    consent: true,
    ...over,
  };
}

const captured = { warn: [], error: [], info: [] };
const originalConsole = {};
for (const kind of Object.keys(captured)) {
  originalConsole[kind] = console[kind];
  console[kind] = (...args) => captured[kind].push(args);
}
const fmt = (args) =>
  args.map((a) => (a && typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
const warnings = () => captured.warn.map(fmt).join("\n");
const errors = () => captured.error.map(fmt).join("\n");
const infos = () => captured.info.map(fmt).join("\n");
function resetLogs() {
  for (const kind of Object.keys(captured)) captured[kind].length = 0;
}

async function main() {
  // 1. Happy path: one insert, one ref, no idempotency column when no key is sent.
  let db = fakeSupabase([ok()]);
  let res = await POST(request(payload()));
  let body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ref, "VT-1234");
  assert.equal(body.priceUsd, 100, "el precio lo calcula el servidor");
  assert.equal(db.inserts.length, 1);
  assert.match(db.inserts[0].ref, /^VT-[2-9A-HJ-NP-Z]{6}$/);
  assert.equal(db.inserts[0].idempotency_key, undefined, "sin clave no se escribe la columna");

  // 2. Ref collision: the unique index rejects it and the handler draws again.
  resetLogs();
  db = fakeSupabase([{ data: null, error: DUP_REF }, { data: null, error: DUP_REF }, ok()]);
  res = await POST(request(payload()));
  body = await res.json();
  assert.equal(res.status, 200, "una colisión de ref no puede fallar la reserva");
  assert.equal(db.inserts.length, 3, "reintenta hasta encontrar una ref libre");
  assert.match(warnings(), /already taken/);

  // 3. Idempotency: resending the same key returns the booking that already exists.
  resetLogs();
  db = fakeSupabase([{ data: null, error: DUP_KEY }], { data: { ...ROW, ref: "VT-7777" }, error: null });
  res = await POST(request(payload({ idempotencyKey: "e2e-key-0001" })));
  body = await res.json();
  assert.equal(res.status, 200, "un reintento no puede devolver 500");
  assert.equal(body.ref, "VT-7777");
  assert.equal(body.duplicate, true);
  assert.equal(db.inserts.length, 1, "no inserta una segunda fila");
  assert.equal(db.inserts[0].idempotency_key, "e2e-key-0001");
  assert.match(infos(), /duplicate submission ignored/);

  // 4. A keyed request without a conflict still succeeds and carries the key.
  resetLogs();
  db = fakeSupabase([ok()]);
  res = await POST(request(payload({ idempotencyKey: "e2e-key-0002" })));
  assert.equal(res.status, 200);
  assert.equal(db.inserts[0].idempotency_key, "e2e-key-0002");

  // 5. Unknown database failure: 500 with the error context in the logs.
  resetLogs();
  fakeSupabase([{ data: null, error: { code: "23503", message: "violates foreign key constraint" } }]);
  res = await POST(request(payload()));
  body = await res.json();
  assert.equal(res.status, 500);
  assert.equal(body.error, "db_error");
  assert.match(errors(), /insert failed/);
  assert.match(errors(), /23503/);

  // 6. Ref exhaustion reports itself instead of looping.
  resetLogs();
  db = fakeSupabase([{ data: null, error: DUP_REF }]);
  res = await POST(request(payload()));
  body = await res.json();
  assert.equal(res.status, 500);
  assert.equal(body.error, "ref_generation");
  assert.equal(db.inserts.length, 5, "5 dibujos por intento");
  assert.match(errors(), /no free ref/);

  // 7. Missing configuration: 503 (not an opaque 500) and a log line that names the cause.
  resetLogs();
  stub = null;
  res = await POST(request(payload()));
  body = await res.json();
  assert.equal(res.status, 503);
  assert.equal(body.error, "server_misconfigured");
  assert.match(errors(), /SUPABASE_URL/);

  // 8. Migration 003 not applied: the column is dropped and the booking still lands.
  //    MUST run last: the handler remembers the failure for a few minutes, so afterwards
  //    no request sends the column. The second insert is the fix under test — the retry
  //    has to omit the column, or all five attempts would fail the same way.
  resetLogs();
  db = fakeSupabase([{ data: null, error: NO_COLUMN }, ok()]);
  res = await POST(request(payload({ idempotencyKey: "e2e-key-0003" })));
  body = await res.json();
  assert.equal(res.status, 200, "la web debe seguir aceptando reservas sin la migración 003");
  assert.equal(db.inserts.length, 2);
  assert.equal(db.inserts[0].idempotency_key, "e2e-key-0003");
  assert.equal(db.inserts[1].idempotency_key, undefined, "el reintento ya no envía la columna");
  assert.ok(db.inserts[1].ref, "el reintento conserva una ref");
  assert.match(warnings(), /idempotency_key is missing/);

  // 9. /api/health publica la revisión desplegada: la pregunta "¿ya tiene producción el
  //    código que empujé?" se responde preguntando, no deduciéndolo del comportamiento.
  const health = load(path.join(root, "app/api/health/route.ts"));
  const schema = load(path.join(root, "lib/supabase/schema.ts"));

  // Cliente mínimo para la sonda de esquema, que imita a PostgREST de verdad (comprobado
  // contra el proyecto real): con `head: true` NO valida el esquema y responde 204 sin
  // error; sin `head`, el error de la consulta llega tal cual. Modelarlo importa: si
  // alguien vuelve a poner `head: true`, la sonda diría "esquema al día" y estos tests
  // tienen que romperse en vez de dejarlo pasar.
  function fakeSchemaClient(error) {
    const seen = [];
    stub = {
      seen,
      from(table) {
        seen.push(table);
        return {
          select(columns, options = {}) {
            const result = options.head
              ? { data: null, error: null, count: null, status: 204 }
              : { data: null, error, count: null, status: error ? 400 : 200 };
            return {
              limit: async () => result,
              then: (resolve) => Promise.resolve(result).then(resolve),
            };
          },
        };
      },
    };
    return stub;
  }
  const envKeys = [
    "RAILWAY_GIT_COMMIT_SHA",
    "RAILWAY_GIT_BRANCH",
    "RAILWAY_ENVIRONMENT_NAME",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const savedEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

  process.env.RAILWAY_GIT_COMMIT_SHA = "e7ab8be0123456789abcdef0123456789abcdef0";
  process.env.RAILWAY_GIT_BRANCH = "master";
  process.env.RAILWAY_ENVIRONMENT_NAME = "production";
  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-stub";

  // 9a. Todo en orden: revisión publicada y esquema al día.
  fakeSchemaClient(null);
  const okRes = await health.GET();
  const okBody = await okRes.json();
  assert.equal(okRes.status, 200);
  assert.equal(okBody.checks.migration003, true);
  assert.equal(okBody.warnings, undefined, "esquema al día = sin avisos");
  assert.equal(okBody.version.commitShort, "e7ab8be");
  assert.equal(okBody.version.branch, "master");
  assert.equal(okBody.version.environment, "production");
  assert.equal(okBody.version.source, "railway");
  assert.equal(okRes.headers.get("x-deployed-commit"), "e7ab8be");
  // Sin no-store, un proxy contestaría con el despliegue anterior.
  assert.match(okRes.headers.get("cache-control") ?? "", /no-store/);

  // 9b. Migración 003 sin aplicar: tiene que VERSE (aviso + check), pero el código sigue
  //     siendo 200. Un 503 aquí haría que el healthcheck de Railway no promoviera el
  //     despliegue que precisamente degrada con gracia: "funciona sin idempotencia"
  //     pasaría a "no despliega".
  fakeSchemaClient({
    code: "PGRST204",
    message: "Could not find the 'idempotency_key' column of 'bookings' in the schema cache",
  });
  const driftRes = await health.GET();
  const driftBody = await driftRes.json();
  assert.equal(driftRes.status, 200, "el drift de esquema no puede bloquear el healthcheck");
  assert.equal(driftBody.status, "ok");
  assert.equal(driftBody.checks.migration003, false);
  assert.match(driftBody.warnings.join(" "), /003_booking_idempotency/);

  // 9c. Ni la tabla existe: mismo desajuste, aviso distinto (ahí no se puede escribir nada).
  fakeSchemaClient({
    code: "PGRST205",
    message: "Could not find the table 'public.bookings' in the schema cache",
  });
  const noTableBody = await (await health.GET()).json();
  assert.equal(noTableBody.checks.migration003, false);
  assert.match(noTableBody.warnings.join(" "), /bookings table does not exist/);

  // 9d. Degradado: sigue diciendo qué revisión está viva, que es cuando más importa. Sin
  //     Supabase configurado la migración queda "no se sabe" y no se consulta la base.
  const untouched = fakeSchemaClient(null);
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const degradedRes = await health.GET();
  const degradedBody = await degradedRes.json();
  assert.equal(degradedRes.status, 503);
  assert.equal(degradedBody.status, "degraded");
  assert.equal(degradedBody.version.commitShort, "e7ab8be");
  assert.equal(degradedBody.checks.migration003, null);
  assert.equal(untouched.seen.length, 0, "sin configuración no se llama a la base");

  // 9e. La sonda no puede colgar el healthcheck: se rinde y dice que no sabe.
  const hanging = { from: () => ({ select: () => ({ limit: () => new Promise(() => {}) }) }) };
  const timedOut = await schema.probeBookingMigrations(hanging, 50);
  assert.equal(timedOut.idempotencyKey, null);
  assert.match(timedOut.warning, /did not answer within 50 ms/);

  // Sin datos del host se dice "unknown", en vez de inventar una versión.
  delete process.env.RAILWAY_GIT_COMMIT_SHA;
  const unknownRes = await health.GET();
  const unknownBody = await unknownRes.json();
  assert.equal(unknownBody.version.source, "unknown");
  assert.equal(unknownBody.version.commit, null);
  assert.equal(unknownRes.headers.get("x-deployed-commit"), "unknown");

  for (const key of envKeys) {
    const value = savedEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  console.log("PASS: 8 casos de POST /api/bookings con Supabase simulado (ref, idempotencia, logs, degradación) + health (revisión desplegada, drift de esquema, sonda acotada)");
}

main().catch((error) => {
  Object.assign(console, originalConsole);
  console.error("FALLO:", error.message);
  process.exit(1);
});
