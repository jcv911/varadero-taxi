// Deletes ONLY the e2e test rows (by reference) using the service_role.
// Reads env from .env.local WITHOUT printing. Verifies zero rows remain.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REFS_FILE = path.join(ROOT, "scripts", ".e2e-refs.json");
const NAME = "PRUEBA - NO PRESTAR SERVICIO";

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
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const refs = fs.existsSync(REFS_FILE) ? JSON.parse(fs.readFileSync(REFS_FILE, "utf8")) : [];
const unique = [...new Set(refs.filter(Boolean))];
console.log(`Limpieza: ${unique.length} referencia(s) guardadas`);

let deleted = 0;
for (const ref of unique) {
  const { error } = await admin.from("bookings").delete().eq("ref", ref);
  if (error) {
    console.error(`  ERROR borrando ${ref}: ${error.message}`);
    process.exit(1);
  }
  deleted++;
}

// Segunda pasada por nombre: si una prueba crea una fila con una ref que no llegó a
// guardarse (p. ej. un reenvío que no pudo leerse), la limpieza por referencia no la ve.
// El nombre marca inequívocamente las filas de prueba, así que se borran también por ahí.
{
  const { error } = await admin.from("bookings").delete().eq("name", NAME);
  if (error) {
    console.error(`  ERROR borrando filas de prueba por nombre: ${error.message}`);
    process.exit(1);
  }
}

const byRef = await admin.from("bookings").select("ref").in("ref", unique.length ? unique : ["__none__"]);
const remainingByRef = byRef.data ?? [];
const byName = await admin.from("bookings").select("ref").eq("name", NAME);
const remainingByName = byName.data ?? [];

console.log(`Borrados: ${deleted}`);
console.log(`Filas restantes con esas referencias: ${remainingByRef.length} (esperado 0)`);
console.log(`Filas restantes con nombre ${"PRUEBA-***"}: ${remainingByName.length} (esperado 0)`);

if (remainingByRef.length === 0 && remainingByName.length === 0) {
  if (fs.existsSync(REFS_FILE)) fs.rmSync(REFS_FILE);
  console.log("CLEAN OK");
  process.exit(0);
}
if (remainingByRef.length > 0) console.log("Aviso: aún existen filas con esas referencias");
if (remainingByName.length > 0) {
  console.log(`Aviso: quedan filas PRUEBA sin borrar por política: ${remainingByName.map((r) => r.ref).join(", ")}`);
}
process.exit(2);