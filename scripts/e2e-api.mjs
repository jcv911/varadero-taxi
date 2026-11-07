// E2E API tests against the local server (default http://localhost:4000).
// Reads env from .env.local WITHOUT printing. Prints only masked data and refs.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.E2E_BASE_URL || "http://localhost:4000";
const REFS_FILE = path.join(ROOT, "scripts", ".e2e-refs.json");

const NAME = "PRUEBA - NO PRESTAR SERVICIO";
const PHONE = "+53500112233";
const MASKED_NAME = "PRUEBA-***";
const MASKED_PHONE = "+5350011****";
const HOTEL = "Hotel Test Varadero Centro";

function loadEnv() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, k, raw] = m;
    let v = raw.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (from .env.local)");
  process.exit(2);
}
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} };
  cache.set(file, mod);
  const ts = require("typescript");
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const resolve = (id) => (id.startsWith("@/") ? load(path.join(ROOT, `${id.slice(2)}.ts`)) : require(id));
  new Function("require", "module", "exports", code)(resolve, mod, mod.exports);
  return mod.exports;
}
const dates = load(path.join(ROOT, "lib", "bookingDate.ts"));
const { getRoutePrice } = load(path.join(ROOT, "lib", "routes.ts"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PACE_MS = 16_000;
let lastHit = 0;
async function pacedPost(body) {
  const wait = lastHit + PACE_MS - Date.now();
  if (wait > 0) await sleep(wait);
  // `lastHit` must be the moment the request is actually issued. Storing the timestamp
  // captured BEFORE the sleep made the next call compute a wait of ~0 and fire straight
  // away, so requests went out in pairs sitting exactly on the 5-per-minute rate limit —
  // intermittently turning valid validation cases into spurious 429s.
  lastHit = Date.now();
  return post(body);
}
async function post(body) {
  const res = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

let failures = 0;
let passes = 0;
const refs = [];
function check(cond, label, detail = "") {
  if (cond) {
    passes++;
    console.log(`  OK  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function saveRefs() {
  const existing = fs.existsSync(REFS_FILE) ? JSON.parse(fs.readFileSync(REFS_FILE, "utf8")) : [];
  fs.writeFileSync(REFS_FILE, JSON.stringify([...new Set([...existing, ...refs])], null, 2));
}

function basePayload(over = {}) {
  const date = dates.addCalendarDays(dates.bookingClock().date, 1);
  return {
    mode: "trip",
    direction: "from",
    routeId: "varadero-havana",
    date,
    time: "10:00",
    vehicleId: "sedan",
    passengers: 1,
    luggage: 1,
    hotelPickup: HOTEL,
    otherAddress: undefined,
    flightNumber: undefined,
    name: NAME,
    whatsapp: PHONE,
    email: "",
    notes: "",
    consent: true,
    ...over,
  };
}

async function main() {
  const expectedPrice = getRoutePrice("varadero-havana", "sedan"); // 90
  console.log(`E2E-API contra ${BASE} · Nombre: ${MASKED_NAME} · Teléfono: ${MASKED_PHONE}`);

  const r1 = await pacedPost(basePayload());
  check(r1.status === 200, "A1 reserva válida (Varadero→La Habana, sedán, mañana 10:00) -> 200", `status=${r1.status}`);
  if (r1.status === 200) {
    check(/^VT-\d{4}$/.test(r1.json.ref ?? ""), "A1 ref con formato VT-XXXX", String(r1.json.ref));
    check(r1.json.priceUsd === expectedPrice, `A1 priceUsd=${r1.json.priceUsd} == computePrice(${expectedPrice})`);
    refs.push(r1.json.ref);
  }

  const r2 = await pacedPost(basePayload({ priceUsd: 1 }));
  check(r2.status === 200, "A2 precio manipulado (enviado 1) -> 200", `status=${r2.status}`);
  if (r2.status === 200) {
    check(("priceUsd" in r2.json) && r2.json.priceUsd === expectedPrice, `A2 se ignora: priceUsd=${r2.json.priceUsd} == ${expectedPrice}`);
    refs.push(r2.json.ref);
  }

  const invalid = [
    ["A3a sin recogida en Varadero", basePayload({ hotelPickup: "" }), 400, "hotelPickup"],
    ["A3b aeropuerto sin nº de vuelo", basePayload({ routeId: "varadero-airport", flightNumber: "" }), 400, "required_for_airport"],
    ["A3c 'hacia Varadero' sin dirección del otro extremo", basePayload({ direction: "to" }), 400, "otherAddress"],
    ["A3d pasajeros sobre capacidad (sedán máx 3)", basePayload({ passengers: 5 }), 400, "vehicle_capacity"],
    ["A3e maletas sobre capacidad (sedán máx 2)", basePayload({ luggage: 4 }), 400, "vehicle_capacity"],
    ["A3f hora dentro de antelación mínima", basePayload({ date: dates.bookingClock().date, time: dates.bookingClock(new Date(Date.now() + 60 * 60 * 1e3)).time }), 400, "date_too_soon"],
    ["A3g sin consentimiento", basePayload({ consent: false }), 400, "consent"],
    ["A3h teléfono inválido", basePayload({ whatsapp: "no-telefono" }), 400, "whatsapp"],
  ];
  for (const [label, payload, wantStatus, wantIssue] of invalid) {
    const r = await pacedPost(payload);
    const issuePath = (r.json && r.json.issues && r.json.issues[0] && String(r.json.issues[0].path && r.json.issues[0].path[0])) || "";
    const issueMsg = (r.json && r.json.issues && r.json.issues[0] && String(r.json.issues[0].message)) || "";
    const ok = r.status === wantStatus && (wantIssue === "" || issuePath === wantIssue || issueMsg === wantIssue);
    check(ok, `${label} -> ${wantStatus}`, `status=${r.status} error=${r.json?.error} issue=${issuePath}/${issueMsg}`);
  }

  const r4h = await pacedPost(basePayload({ honeypot: "spam" }));
  check(r4h.status === 403 && r4h.json?.error === "honeypot", "A3i honeypot relleno -> 403", `status=${r4h.status}`);

  // A6 idempotencia: reintentar el MISMO envío (misma clave) debe devolver la reserva ya
  // creada, no una segunda fila. Va antes de la ráfaga A5 porque esta agota el rate limit.
  const idemKey = `e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const r6a = await pacedPost(basePayload({ idempotencyKey: idemKey }));
  check(r6a.status === 200, "A6a primer envío con clave de idempotencia -> 200", `status=${r6a.status} error=${r6a.json?.error}`);
  const r6b = await pacedPost(basePayload({ idempotencyKey: idemKey }));
  check(r6b.status === 200, "A6b reintento del mismo envío -> 200 (no 500 ni duplicado)", `status=${r6b.status} error=${r6b.json?.error}`);
  if (r6a.status === 200 && r6b.status === 200) {
    check(r6b.json.ref === r6a.json.ref, `A6b devuelve la misma ref ${r6a.json.ref}`, String(r6b.json.ref));
    check(r6b.json.duplicate === true, "A6b respuesta marcada como duplicate");
    refs.push(r6a.json.ref);
  }
  const r6c = await admin.from("bookings").select("ref", { count: "exact" }).eq("idempotency_key", idemKey);
  if (r6c.error) {
    check(false, "A6c consulta de filas por idempotency_key", `${r6c.error.code} ${r6c.error.message} (¿aplicada la migración 003?)`);
  } else {
    check(r6c.count === 1, `A6c una sola fila con esa clave en BD (count=${r6c.count})`);
  }

  await saveRefs();

  const r4 = refs[0]
    ? await admin.from("bookings").select("*").eq("ref", refs[0]).maybeSingle()
    : { data: null };
  if (refs[0] && r4.data) {
    const row = r4.data;
    check(row.date === basePayload().date, "A4 columna date = YYYY-MM-DD enviado", row.date);
    check(row.time === "10:00", "A4 columna time = HH:MM enviado", row.time);
    check(row.status === "pendiente", "A4 estado pendiente", row.status);
    check(row.direction === "from", "A4 direction conservado", row.direction);
    check(row.other_address == null, "A4 other_address null (no enviado)", String(row.other_address));
    check(!!row.created_at, "A4 created_at existe", String(row.created_at));
    void row;
  } else {
    check(false, "A4 verificación por referencia (fila no encontrada)", String(refs[0]));
  }

  const r5 = refs[1]
    ? await admin.from("bookings").select("ref, price_usd").eq("ref", refs[1]).maybeSingle()
    : { data: null };
  if (refs[1] && r5.data) {
    check(Number(r5.data.price_usd) === expectedPrice, `A2 en BD price_usd=${Number(r5.data.price_usd)} (manipulado ignorado)`);
    void r5.data;
  } else {
    check(false, "A2 fila manipulada no encontrada en BD", String(refs[1]));
  }

  await saveRefs();

  let burst429 = false;
  let burstCalls = 0;
  for (let i = 0; i < 16; i++) {
    burstCalls++;
    const r = await post({ honeypot: "", mode: "trip", date: "", time: "" });
    if (r.status === 429) {
      burst429 = true;
      break;
    }
  }
  check(burst429, `A5 ráfaga -> 429 (en ${burstCalls} llamadas)`);

  console.log(`\nResultado: ${passes} OK / ${failures} FAIL`);
  console.log(`Referencias a limpiar: ${refs.join(", ")}`);
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error("E2E-API crash:", e);
  process.exit(1);
});