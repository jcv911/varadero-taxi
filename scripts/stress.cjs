// Prueba de estrés LOCAL contra el servidor local y la base REAL.
//
// Cubre cuatro cosas que un test funcional no mide:
//   1. Capacidad de lectura (páginas y /api/health) con latencias y tasa de error.
//   2. El rate limiter: presupuesto real por IP, y que la clave sea la IP declarada
//      en `x-forwarded-for` (que un cliente puede inventar).
//   3. Crecimiento del `Map` de IPs, que nunca borra entradas.
//   4. Corrección bajo concurrencia: idempotencia (N envíos a la vez con la MISMA
//      clave -> UNA fila) y unicidad de `ref` en una ráfaga de reservas distintas.
//
// Escribe filas marcadas como "PRUEBA - NO PRESTAR SERVICIO" y las deja en
// scripts/.e2e-refs.json para que las borre `node scripts/cleanup-e2e.mjs`.
// Nunca apunta a producción: aborta si el destino no es loopback.
//
// Uso:  node scripts/stress.cjs [--pid <pidDelServidor>]
//       STRESS_ONLY=burst            (solo esa fase; vacío = todas)
//       BASE_URL=http://localhost:4000   STRESS_SCALE=1   MAP_BUDGET_MS=20000
//       BURST_N=150   BURST_ROUNDS=5 (ráfagas: cuantas más, más probable la colisión de ref)
const { createRequire } = require("node:module");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const require2 = createRequire(__filename);
const { createClient } = require2("@supabase/supabase-js");

const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.BASE_URL || "http://localhost:4000";
const REFS_FILE = path.join(ROOT, "scripts", ".e2e-refs.json");
const NAME = "PRUEBA - NO PRESTAR SERVICIO";
const SCALE = Number(process.env.STRESS_SCALE || 1);
const MAP_BUDGET_MS = Number(process.env.MAP_BUDGET_MS || 20_000);
const X = (n) => Math.max(1, Math.round(n * SCALE));
/** Fases a ejecutar: read, limiter, mem, idem, burst (vacío = todas). */
const ONLY = (process.env.STRESS_ONLY || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const want = (phase) => ONLY.length === 0 || ONLY.includes(phase);

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

// ── Guarda de seguridad: esto escribe en la base real ────────────────────────────────
{
  const host = new URL(BASE).hostname;
  const loopback = ["localhost", "127.0.0.1", "::1", "[::1]"];
  if (!loopback.includes(host) && process.env.ALLOW_REMOTE !== "1") {
    console.error(
      `ABORTADO: ${BASE} no es loopback. Esta prueba ESCRIBE filas reales y el rate limiter\n` +
        `de un servidor en producción es su única defensa frente a una avalancha de reservas\n` +
        `falsas. Si de verdad quieres apuntar a un host remoto: ALLOW_REMOTE=1.`
    );
    process.exit(2);
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (en .env.local)");
  process.exit(2);
}
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

// lib/bookingDate.ts transpilado, igual que en e2e-api.mjs: la fecha válida tiene que
// salir del reloj de Cuba, no del reloj de esta máquina.
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} };
  cache.set(file, mod);
  const ts = require2("typescript");
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const resolve = (id) => (id.startsWith("@/") ? load(path.join(ROOT, `${id.slice(2)}.ts`)) : require2(id));
  new Function("require", "module", "exports", code)(resolve, mod, mod.exports);
  return mod.exports;
}
const dates = load(path.join(ROOT, "lib", "bookingDate.ts"));

let passes = 0;
let failures = 0;
const refs = [];
function check(cond, label, detail = "") {
  if (cond) {
    passes++;
    console.log(`  OK   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hotels = Array.from({ length: 20 }, (_, i) => `Hotel Estrés ${i + 1} Varadero`);

let ipSeq = 0;
function nextIp() {
  // IPs distintas para no chocar con el rate limit: es lo que hace un cliente que
  // rota el valor de x-forwarded-for, y es justo lo que queremos medir.
  ipSeq++;
  return `10.${(ipSeq >> 16) & 255}.${(ipSeq >> 8) & 255}.${ipSeq & 255}`;
}

function validPayload(over = {}) {
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
    hotelPickup: hotels[ipSeq % hotels.length],
    name: NAME,
    whatsapp: "+53500112233",
    email: "",
    notes: "",
    consent: true,
    ...over,
  };
}

async function post(body, { ip } = {}) {
  const started = performance.now();
  try {
    const res = await fetch(`${BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(ip ? { "x-forwarded-for": ip } : {}) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    return { status: res.status, json: await res.json().catch(() => null), ms: performance.now() - started };
  } catch (error) {
    return { status: 0, json: null, ms: performance.now() - started, error: String(error?.message ?? error) };
  }
}

async function get(pathname) {
  const started = performance.now();
  try {
    const res = await fetch(`${BASE}${pathname}`, { signal: AbortSignal.timeout(15_000) });
    await res.arrayBuffer();
    return { status: res.status, ms: performance.now() - started };
  } catch (error) {
    return { status: 0, ms: performance.now() - started, error: String(error?.message ?? error) };
  }
}

/** Ejecuta `total` tareas con `concurrency` a la vez y devuelve los resultados. */
async function pool(total, concurrency, task) {
  const results = new Array(total);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, total) }, async () => {
      while (true) {
        const i = next++;
        if (i >= total) return;
        results[i] = await task(i);
      }
    })
  );
  return results;
}

function stats(samples) {
  if (!samples.length) return { p50: 0, p95: 0, p99: 0, max: 0 };
  const s = [...samples].sort((a, b) => a - b);
  const at = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
  return { p50: at(0.5), p95: at(0.95), p99: at(0.99), max: s[s.length - 1] };
}

function serverRss(pid) {
  if (!pid) return null;
  try {
    const out = execFileSync(
      "powershell",
      ["-NoProfile", "-Command", `(Get-Process -Id ${pid}).WorkingSet64`],
      { encoding: "utf8" }
    ).trim();
    return Number(out);
  } catch {
    return null;
  }
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);

async function main() {
  const pidArg = process.argv.indexOf("--pid");
  const pid = pidArg > -1 ? Number(process.argv[pidArg + 1]) : 0;

  console.log(`Estrés contra ${BASE} · marcador "${NAME}" · escala ${SCALE}`);
  const before = await admin.from("bookings").select("ref", { count: "exact" }).eq("name", NAME);
  if (before.error) {
    console.error(`No se pudo leer la tabla: ${before.error.code} ${before.error.message}`);
    process.exit(2);
  }
  console.log(`Filas de prueba antes de empezar: ${before.count} (esperado 0)\n`);

  // ── 1. Capacidad de lectura ────────────────────────────────────────────────────────
  if (want("read")) {
    const total = X(200);
    const concurrency = 20;
    const t0 = Date.now();
    const res = await pool(total, concurrency, (i) => get(i % 2 === 0 ? "/es" : "/en"));
    const elapsed = (Date.now() - t0) / 1000;
    const ok = res.filter((r) => r.status === 200);
    const s = stats(res.map((r) => r.ms));
    console.log(`1) Lectura · ${total} GET (/es y /en) · concurrencia ${concurrency}`);
    console.log(
      `   ${(total / elapsed).toFixed(0)} req/s · p50 ${s.p50.toFixed(0)} ms · p95 ${s.p95.toFixed(0)} ms · p99 ${s.p99.toFixed(
        0
      )} ms · máx ${s.max.toFixed(0)} ms`
    );
    check(ok.length === total, `${total}/${total} respuestas 200`, `${total - ok.length} fallaron (${[...new Set(res.map((r) => r.status))].join(",")})`);
    check(s.p95 < 2000, `p95 ${s.p95.toFixed(0)} ms por debajo del tope de humo (2000 ms)`);

    const hTotal = X(20);
    const h0 = Date.now();
    const hres = await pool(hTotal, 4, () => get("/api/health"));
    const hElapsed = (Date.now() - h0) / 1000;
    const hs = stats(hres.map((r) => r.ms));
    const hOk = hres.filter((r) => r.status === 200);
    console.log(`   /api/health · ${hTotal} GET (cada uno sondea la base) · concurrencia 4`);
    console.log(`   ${(hTotal / hElapsed).toFixed(0)} req/s · p50 ${hs.p50.toFixed(0)} ms · p95 ${hs.p95.toFixed(0)} ms`);
    check(hOk.length === hTotal, `${hTotal}/${hTotal} health 200`, `${hTotal - hOk.length} fallaron`);
  }

  // ── 2. Rate limiter: presupuesto real por IP ──────────────────────────────────────
  if (want("limiter")) {
    console.log(`\n2) Rate limiter · misma IP declarada`);
    const ip = "203.0.113.7";
    // Payload inválido a propósito: el limiter se evalúa ANTES de la validación, así que
    // gasta presupuesto sin escribir ninguna fila.
    const statuses = [];
    for (let i = 0; i < 8; i++) {
      const r = await post({ mode: "trip", date: "", time: "" }, { ip });
      statuses.push(r.status);
    }
    const first429 = statuses.indexOf(429);
    check(first429 === 5, `se agota en la 6ª llamada: 5 pasan (400) y luego 429`, `statuses=${statuses.join(",")}`);
    check(statuses.slice(0, 5).every((s) => s === 400), "las 5 primeras son evaluadas (400 de validación, no 429)", statuses.slice(0, 5).join(","));

    // Y ahora la consecuencia para un usuario legítimo detrás de esa misma IP.
    const legit = await post(validPayload(), { ip });
    check(legit.status === 429, "una reserva VÁLIDA de esa IP es rechazada por el limiter", `status=${legit.status}`);

    console.log(`\n3) Rate limiter · IPs distintas (cliente que rota x-forwarded-for)`);
    const distinct = X(25);
    const dres = await pool(distinct, 10, () => post({ mode: "trip", date: "", time: "" }, { ip: nextIp() }));
    const d429 = dres.filter((r) => r.status === 429).length;
    check(d429 === 0, `${distinct} peticiones con ${distinct} IPs distintas: 0 rechazos`, `${d429} devolvieron 429`);
  }

  // ── 4. Carga sostenida con IPs nuevas (medición, sin certificado) ────────────────
  //
  // Esta fase NO afirma nada sobre la memoria, y es deliberado. Medido con controles:
  // el mismo volumen contra `/es` (que no toca el Map) subió el RSS MÁS que esta fase,
  // y tras unos segundos en reposo el proceso devolvió casi todo al sistema. Es decir:
  // lo que se ve aquí es expansión del heap de V8 bajo carga, no una fuga por entrada.
  // Afirmar «el Map causa X MB» habría sido una atribución falsa. Lo que sí es un hecho
  // de código (no de medición) es que el Map guarda una entrada por IP y nunca borra
  // ninguna; su coste es ~200 B por IP ÚNICA, no por petición.
  if (want("mem")) {
    console.log(`\n4) Memoria bajo carga sostenida · ${MAP_BUDGET_MS / 1000}s de IPs nuevas`);
    const rssBefore = serverRss(pid);
    const deadline = Date.now() + MAP_BUDGET_MS;
    let sent = 0;
    const t0 = Date.now();
    await pool(50, 50, async () => {
      while (Date.now() < deadline) {
        // Un `while` dentro de cada worker mantiene la carga constante todo el presupuesto.
        await post({ mode: "trip", date: "", time: "" }, { ip: nextIp() });
        sent++;
      }
      return null;
    });
    const elapsed = (Date.now() - t0) / 1000;
    const rssPeak = serverRss(pid);
    console.log(`   ${sent} peticiones en ${elapsed.toFixed(0)} s (${(sent / elapsed).toFixed(0)} req/s) desde ${sent} IPs distintas`);
    if (rssBefore && rssPeak) {
      console.log(`   MEDICIÓN  RSS del servidor: ${mb(rssBefore)} MB -> ${mb(rssPeak)} MB tras ${elapsed.toFixed(0)} s de carga`);
      console.log("   Ojo: dominado por expansión del heap de V8, no por el Map (ver comentario de esta fase).");
    }
    console.log(
      "   El Map suma ~200 B por IP ÚNICA y no borra nunca: el coste grande llega por número de IPs\n" +
        "   distintas, y la clave es el primer valor de x-forwarded-for, que el cliente controla."
    );
  }

  // ── 5. Idempotencia con envíos SIMULTÁNEOS ────────────────────────────────────────
  if (want("idem")) {
    console.log(`\n5) Idempotencia · N envíos a la vez con la MISMA clave`);
    const n = X(10);
    const key = `stress-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const res = await pool(n, n, () => post(validPayload({ idempotencyKey: key }), { ip: nextIp() }));
    const statuses = res.map((r) => r.status);
    const refsSeen = [...new Set(res.map((r) => r.json?.ref).filter(Boolean))];
    const duplicates = res.filter((r) => r.json?.duplicate === true).length;
    check(statuses.every((s) => s === 200), `${n}/${n} responden 200`, statuses.join(","));
    check(refsSeen.length === 1, `las ${n} respuestas comparten UNA ref (${refsSeen[0]})`, refsSeen.join(","));
    check(duplicates >= n - 1, `${duplicates} respuestas marcadas duplicate (esperado ${n - 1})`);
    const rows = await admin.from("bookings").select("ref").eq("idempotency_key", key);
    check((rows.data ?? []).length === 1, `UNA sola fila en BD con esa clave`, `filas=${(rows.data ?? []).length}`);
    if (refsSeen[0]) refs.push(refsSeen[0]);
  }

  // ── 6. Ráfagas de reservas distintas · unicidad de `ref` bajo carga ────────────────
  //
  // La `ref` se sortea entre 9000 valores (VT-1000..VT-9999) y la resuelve el índice
  // único, no una consulta previa. Con 120 simultáneas la colisión esperada es
  // C(120,2)/9000 ≈ 0,8 por ronda, así que varias rondas la vuelven probable. La
  // propiedad que se afirma es la que importa: ninguna reserva falla con 500 y ninguna
  // ref se repite en la base, colisione o no.
  if (want("burst")) {
    const n = X(Number(process.env.BURST_N || 120));
    const rounds = Number(process.env.BURST_ROUNDS || 4);
    console.log(`\n6) Ráfagas · ${rounds} x ${n} reservas simultáneas con claves distintas`);
    let total = 0;
    let createdTotal = 0;
    const allRefs = new Set();
    const statusCount = new Map();
    for (let round = 1; round <= rounds; round++) {
      const t0 = Date.now();
      const res = await pool(n, n, () =>
        post(validPayload({ idempotencyKey: `stress-${Date.now().toString(36)}-${ipSeq}-${Math.random().toString(36).slice(2, 10)}` }), {
          ip: nextIp(),
        })
      );
      const elapsed = (Date.now() - t0) / 1000;
      const created = res.filter((r) => r.status === 200);
      const refsSeen = new Set(created.map((r) => r.json?.ref).filter(Boolean));
      for (const r of res) statusCount.set(r.status, (statusCount.get(r.status) ?? 0) + 1);
      for (const ref of refsSeen) allRefs.add(ref);
      total += n;
      createdTotal += created.length;
      const s = stats(res.map((r) => r.ms));
      console.log(
        `   ronda ${round}: ${(n / elapsed).toFixed(0)} reservas/s · p50 ${s.p50.toFixed(0)} ms · p95 ${s.p95.toFixed(
          0
        )} ms · máx ${s.max.toFixed(0)} ms · ${created.length}/${n} creadas · ${refsSeen.size} refs`
      );
    }
    const statuses = [...statusCount.entries()].map(([s, c]) => `${s}:${c}`).join(" ");
    check(createdTotal === total, `${createdTotal}/${total} reservas creadas en total (0 errores 500)`, statuses);
    check(allRefs.size === createdTotal, `${allRefs.size} refs únicas para ${createdTotal} filas`, `${createdTotal - allRefs.size} repetidas`);
    for (const ref of allRefs) refs.push(ref);
    const persisted = await admin.from("bookings").select("ref", { count: "exact" }).eq("name", NAME);
    console.log(`   filas con el marcador en BD: ${persisted.count}`);
    void persisted;
  }

  await saveRefs();
  console.log(`\nResultado: ${passes} OK / ${failures} FAIL`);
  console.log(`Referencias a limpiar: ${refs.length} (guardadas en scripts/.e2e-refs.json)`);
  console.log(`Siguiente paso: node scripts/cleanup-e2e.mjs`);
  // Sin `process.exit()`: en Windows, salir con sockets de keep-alive a medio cerrar
  // dispara un assert de libuv (UV_HANDLE_CLOSING) que ensucia el código de salida
  // (llegó a devolver 127 en una corrida con 0 fallos). Se fija el código y se deja
  // que Node cierre sus handles y salga solo; el temporizador es solo una red por si
  // algún handle se quedara abierto, y va sin ref para no sostener el bucle.
  process.exitCode = failures ? 1 : 0;
  setTimeout(() => process.exit(process.exitCode), 10_000).unref();
}

async function saveRefs() {
  const existing = fs.existsSync(REFS_FILE) ? JSON.parse(fs.readFileSync(REFS_FILE, "utf8")) : [];
  fs.writeFileSync(REFS_FILE, JSON.stringify([...new Set([...existing, ...refs])], null, 2));
}

main().catch((e) => {
  console.error("Estrés crash:", e);
  process.exit(1);
});
