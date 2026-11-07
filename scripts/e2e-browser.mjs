// E2E browser suite sobre el servidor local (default http://localhost:4000).
// Usa el chromium que trae Playwright; `E2E_CHROME_PATH` permite apuntar a un Chrome del
// sistema cuando se quiere probar contra el navegador real de una máquina concreta.
// No imprime claves ni datos personales; solo refs y resultados.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.E2E_BASE_URL || "http://localhost:4000";
const SHOTS = path.join(ROOT, "e2e-screenshots");
const REFS_FILE = path.join(ROOT, "scripts", ".e2e-refs.json");

// Sin ruta propia se usa el chromium de Playwright: una ruta absoluta de una máquina
// concreta no sirve en el CI (y menos aún dentro del repositorio).
const CHROME = process.env.E2E_CHROME_PATH || null;
const NAME = "PRUEBA - NO PRESTAR SERVICIO";
const PHONE = "+53500112233";
const HOTEL = "Hotel Test Varadero Centro";
const OTH_NO = "Casa Particular Test, La Habana";
const OTH_DEST = "Ranchón Test, Varadero";
const FLIGHT = "VRA1234";

fs.mkdirSync(SHOTS, { recursive: true });

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
const { ROUTES } = load(path.join(ROOT, "lib", "routes.ts"));
const { VEHICLES } = load(path.join(ROOT, "lib", "vehicles.ts"));

const config = load(path.join(ROOT, "lib", "config.ts")).config;

let browser;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
let passes = 0;
const refs = [];
const results = [];
function check(cond, label, detail = "") {
  if (cond) {
    passes++;
    console.log(`  OK  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    results.push({ name: label, ok: false, detail });
  }
}

function assert(cond, label, detail = "") {
  if (!cond) throw new Error(`${label}${detail ? ` — ${detail}` : ""}`);
}

async function saveRefs() {
  const existing = fs.existsSync(REFS_FILE) ? JSON.parse(fs.readFileSync(REFS_FILE, "utf8")) : [];
  fs.writeFileSync(REFS_FILE, JSON.stringify([...new Set([...existing, ...refs])], null, 2));
}

async function openWidget(page) {
  await page.goto(`${BASE}/es`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#booking-summary", { timeout: 30000 });
}

async function fillContact(page, { flight = false, other = false } = {}) {
  await page.fill("#name", NAME);
  await page.fill("#whatsapp", PHONE);
  await page.fill("#hotelPickup", HOTEL);
  if (flight) await page.fill("#flightNumber", FLIGHT);
  if (other) await page.fill("#otherAddress", OTH_NO);
  await page.locator('input[type="checkbox"]').check({ force: true });
}

// El endpoint limita a 5 envíos por minuto y por IP. Sin esta pausa, el sexto escenario
// choca con el 429 y falla por el límite de la app, no por el formulario.
const SUBMIT_PACE_MS = 16_000;
let lastSubmit = 0;

async function submitAndAssertSuccess(page, label) {
  const wait = lastSubmit + SUBMIT_PACE_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastSubmit = Date.now();
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await page.getByText("Solicitud recibida").waitFor({ timeout: 30000 });
  const refText = (await page.locator("text=/VT-\\d{4}/").first().textContent().catch(() => "")) || "";
  const match = refText.match(/VT-\d{4}/);
  assert(!!match, `${label}: sucesos con ref`, refText);
  correct_and_push(match[0]);
  // Acotado al widget: el pie de página tiene su propio enlace de WhatsApp desde el rediseño,
  // así que contar los de toda la página daba 2 y el escenario fallaba por eso.
  const wa = page.locator('#widget a[href^="https://wa.me/"]');
  assert((await wa.count()) === 1, `${label}: botón WhatsApp presente`);
  assert((await page.getByText("Tu solicitud está pendiente de confirmación.", { exact: false }).count()) > 0, `${label}: pendiente de confirmación`);
  return match[0];
}

function correct_and_push(ref) {
  if (!refs.includes(ref)) refs.push(ref);
}

function shot(page, name) {
  return page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false }).catch(() => null);
}

const MONTH_SELECTOR = "#widget p.font-display.text-sm.capitalize";

function monthNameEs(key) {
  const { year, month } = split(key);
  return new Intl.DateTimeFormat("es", { timeZone: "UTC", month: "long" }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}
function split(key) {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}
function ariaFor(key) {
  return dates.formatBookingDate(key, "es");
}

async function expectContinuar(page, expected) {
  const btn = page.getByRole("button", { name: "Continuar" });
  const disabled = await btn.isDisabled().catch(() => true);
  assert(disabled === expected, `Continuar ${expected ? "deshabilitado" : "habilitado"}`, `disabled=${disabled}`);
}

async function pickRoute(page, { direction = "from", routeText }) {
  if (direction === "to") {
    await page.getByRole("radio", { name: "Hacia Varadero" }).click();
  }
  const chip = page.getByRole("button").filter({ hasText: routeText }).first();
  await chip.click();
  await page.getByRole("button", { name: "Continuar" }).click();
}

async function defaultSchedule(page) {
  await page.getByRole("button", { name: "Continuar" }).click();
}

async function defaultVehicle(page) {
  await page.getByRole("button", { name: "Continuar" }).click();
}

async function scenario(name, viewport, fn) {
  // El viewport se fija al crear el contexto: `setViewportSize` es de la página, no del
  // contexto, y este script lo llamaba ahí (reventaba con "not a function" en toda corrida).
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 200)));
  try {
    await fn(page, consoleErrors);
    result(name, true);
    console.log(`  SHOT→ e2e-screenshots/${name}-${viewport.width}x${viewport.height}`);
    if (consoleErrors.length) console.log(`  (console errors: ${consoleErrors.length})`);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${name} — ${String(e).slice(0, 300)}`);
    result(name, false, String(e).slice(0, 300));
    await shot(page, `${name}-${viewport.width}x${viewport.height}-error`).catch(() => null);
  } finally {
    await ctx.close();
  }
}

function result(name, ok, detail = "") {
  results.push({ name, ok, detail });
}

async function main() {
  console.log(`E2E-BROWSER contra ${BASE} · Navegador: ${CHROME ?? "chromium de Playwright"}`);
  browser = await chromium.launch({
    ...(CHROME ? { executablePath: CHROME } : {}),
    headless: true,
  });

  for (const vp of [{ width: 375, height: 667 }, { width: 1280, height: 800 }]) {
    await scenario("B1-varadero-a-habana", vp, async (page) => {
      await openWidget(page);
      await pickRoute(page, { routeText: "Hacia La Habana" });      // paso 1 -> 2
      await defaultSchedule(page);                                  // paso 2 -> 3
      await defaultVehicle(page);                                   // paso 3 -> 4
      // revisión
      assert((await page.getByText("Revisa tu reserva").count()) > 0, "revisión: título");
      assert((await page.getByText("La Habana").count()) > 0, "revisión: trayecto La Habana");
      assert((await page.getByText("10:00").count()) > 0, "revisión: hora 10:00");
      assert((await page.getByText("Hora de Cuba").count()) > 0, "revisión: hora de Cuba");
      await shot(page, `B1-review-${vp.width}`);
      // atrás no pierde datos
      const nav = page.locator('nav[aria-label="Pasos de la reserva"] button');
      await nav.nth(1).click();                                     // volver a paso 2
      assert((await page.getByRole("button", { name: "10:00" }).getAttribute("aria-pressed")) === "true", "atrás: hora 10:00 conservada");
      // El stepper solo deja retroceder (los pasos futuros están deshabilitados), así que para
      // volver a la revisión hay que atravesar el paso 3 otra vez, como lo haría una persona.
      await page.getByRole("button", { name: "Continuar" }).click();  // 2 -> 3
      await page.getByRole("button", { name: "Continuar" }).click();  // 3 -> 4
      assert((await page.getByText("Revisa tu reserva").count()) > 0, "atrás: revisión conservada");
      await page.getByRole("button", { name: "Continuar" }).click();
      await fillContact(page);
      await submitAndAssertSuccess(page, `B1 success ${vp.width}`);
      await shot(page, `B1-success-${vp.width}`);
    });
  }

  for (const vp of [{ width: 375, height: 667 }, { width: 1280, height: 800 }]) {
    await scenario("B2-aeropuerto-a-varadero", vp, async (page) => {
      await openWidget(page);
      await pickRoute(page, { direction: "to", routeText: "Aeropuerto" });
      await defaultSchedule(page);
      await defaultVehicle(page);
      assert((await page.getByText("Revisa tu reserva").count()) > 0, "revisión: título");
      assert((await page.getByText(/Aeropuerto/).count()) > 0, "revisión: trayecto Aeropuerto");
      await page.getByRole("button", { name: "Continuar" }).click();
      await fillContact(page, { flight: true });
      await submitAndAssertSuccess(page, `B2 success ${vp.width}`);
      await shot(page, `B2-success-${vp.width}`);
    });
  }

  for (const vp of [{ width: 375, height: 667 }, { width: 1280, height: 800 }]) {
    await scenario("B3-habana-a-varadero", vp, async (page) => {
      await openWidget(page);
      await pickRoute(page, { direction: "to", routeText: "Desde La Habana" });
      await defaultSchedule(page);
      await defaultVehicle(page);
      assert((await page.getByText("Revisa tu reserva").count()) > 0, "revisión: título");
      await page.getByRole("button", { name: "Continuar" }).click();
      await fillContact(page, { other: true });
      await submitAndAssertSuccess(page, `B3 success ${vp.width}`);
      await shot(page, `B3-success-${vp.width}`);
    });
  }

  // B4 capacidad: van 14/10 -> SUV 4/3 recorta
  await scenario("B4-capacidad", { width: 1280, height: 800 }, async (page) => {
    await openWidget(page);
    await pickRoute(page, { routeText: "Hacia La Habana" });
    await defaultSchedule(page);
    // Por nombre accesible, no por texto: las tarjetas llevan su insignia delante del nombre
    // ("Grupos VIP Van 14 pax…") y el texto concatenado no deja límites de palabra, así que
    // un `hasText: /\bVan\b/` no encuentra nada.
    await page.locator("#widget").getByRole("button", { name: /Van/ }).first().click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    // Los botones + son hijos directos del div del contador: el `div` intermedio que pedía este
    // selector no existe, así que no encontraba nada.
    const pluses = page.locator('form button[aria-label="+"]');
    for (let i = 0; i < 13; i++) await pluses.nth(0).click();
    for (let i = 0; i < 9; i++) await pluses.nth(1).click();
    const vals = await page.locator('form span.tabular-nums.text-sm.font-semibold').allTextContents();
    assert(vals[0] === "14" && vals[1] === "10", "van: contadores 14 y 10", vals.join(","));
    await page.keyboard.press("Escape");                       // cerrar sheet -> paso 4
    await page.locator('nav[aria-label="Pasos de la reserva"] button').nth(2).click(); // paso 3 vehículo
    await page.locator("#widget").getByRole("button", { name: /SUV/ }).first().click();
    assert((await page.getByText(/reducido|ajustado/).count()) > 0, "aviso ajuste por capacidad");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    const vals2 = await page.locator('form span.tabular-nums.text-sm.font-semibold').allTextContents();
    assert(vals2[0] === "4" && vals2[1] === "3", "SUV: recorte a 4 y 3", vals2.join(","));
    const pluses2 = page.locator('form button[aria-label="+"]');
    assert(await pluses2.nth(0).isDisabled() && await pluses2.nth(1).isDisabled(), "SUV: contadores no pasan del máximo");
    assert((await page.getByText(/Capacidad m\u00e1xima/).count()) > 0 && (await page.getByText("SUV").count()) > 0, "nota capacidad SUV");
    await shot(page, "B4-capacidad-suv");
  });

  // B5 calendario: sin salto de mes + hora cercana bloquea avance
  await scenario("B5-calendario", { width: 1280, height: 800 }, async (page) => {
    const now = new Date();
    await openWidget(page);
    await pickRoute(page, { routeText: "Hacia La Habana" });
    const defKey = dates.addCalendarDays(dates.bookingClock().date, 1);
    // El rótulo del mes, no un contenedor cualquiera: `div.filter({ has: ... })` cogía el árbol
    // entero (incluida la línea "Fecha seleccionada"), así que la comparación no medía el mes.
    const cal = page.locator(MONTH_SELECTOR).first();
    const calText = await cal.textContent();
    assert(calText.includes(monthNameEs(defKey)) && calText.includes(String(split(defKey).year)), "calendario: mes inicial sin saltar", calText.trim());
    // El botón solo avanza si el mes siguiente entra en la ventana de reserva
    // (`maxAdvanceDays` desde hoy): a principios de mes no entra y entonces no hace nada, que
    // es lo correcto — no se puede reservar en un mes cuyos días están todos fuera de plazo.
    const nextKey = (() => {
      const { year, month } = split(defKey);
      const m = month === 12 ? 1 : month + 1;
      return `${month === 12 ? year + 1 : year}-${String(m).padStart(2, "0")}`;
    })();
    const maxKey = dates.addCalendarDays(dates.bookingClock().date, config.booking.maxAdvanceDays);
    const puedeAvanzar = nextKey <= maxKey.slice(0, 7);
    await page.getByRole("button", { name: "Mes siguiente" }).click();
    // El re-render es asíncrono: se espera a que el rótulo cambie, o a que se agote el plazo.
    await page
      .waitForFunction(([sel, prev]) => document.querySelector(sel)?.textContent.trim() !== prev, [MONTH_SELECTOR, calText], { timeout: 3000 })
      .catch(() => null);
    const calText2 = (await cal.textContent()).trim();
    if (puedeAvanzar) {
      assert(calText2 !== calText && !calText2.includes(monthNameEs(defKey)), "calendario: avanza exacto 1 mes", calText2);
    } else {
      assert(calText2 === calText, "calendario: no avanza a un mes sin días reservables", calText2);
    }
    // hora cercana (hoy) bloquea avance
    const todayKey = dates.bookingClock().date;
    const todayCell = page.getByRole("button", { name: ariaFor(todayKey) });
    const todayDisabled = await todayCell.isDisabled().catch(() => true);
    if (!todayDisabled) {
      await todayCell.click();
      const minAllowed = new Date(now.getTime() + config.booking.minLeadHours * 3600e3);
      const tooSoon10 = dates.bookingInstant(todayKey, "10:00") < minAllowed;
      await expectContinuar(page, tooSoon10);
      const h10 = page.getByRole("button", { name: "10:00" });
      const h10disabled = await h10.isDisabled();
      if (tooSoon10) assert(h10disabled, "hora demasiado cercana deshabilitada");
    }
    await shot(page, "B5-calendario");
  });

  // B6 móvil 375: sin scroll horizontal + CTA no oculta pie (medida)
  await scenario("B6-movil-layout", { width: 375, height: 667 }, async (page) => {
    await openWidget(page);
    const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    assert(noHScroll, "sin scroll horizontal (375x667)");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const cta = page.locator('div[class*="fixed"][class*="bottom-0"]').first();
    const footer = page.locator("footer").first();
    const ctaBox = await cta.boundingBox().catch(() => null);
    const footerBox = await footer.boundingBox().catch(() => null);
    let overlap = "n/a";
    if (ctaBox && footerBox) {
      const overlapPx = Math.max(0, ctaBox.y - (footerBox.y + footerBox.height * 0.5));
      overlap = `${Math.round(footerBox.y + footerBox.height - ctaBox.y)}px de solape vertical`;
      void overlapPx;
      console.log(`  (info) CTA móvil vs footer: ${overlap}`);
    }
    await shot(page, "B6-movil-footer");
  });

  // B7 "Otro destino" sigue pausado
  await scenario("B7-otro-destino-pausado", { width: 375, height: 667 }, async (page) => {
    await openWidget(page);
    const bodyText = await page.locator("body").innerText();
    assert(!/otro destino/i.test(bodyText), "no aparece 'Otro destino'");
    // Cuatro radios en total (dos del modo de servicio y dos de dirección): la comprobación se
    // acota al grupo de dirección, que es lo que este escenario quiere ver.
    const direccion = page.locator('[role="radiogroup"][aria-label="Dirección"] [role="radio"]');
    assert((await direccion.count()) === 2, "dirección Desde/Hacia presente");
    assert((await page.locator("#widget button").filter({ hasText: /min/ }).count()) === ROUTES.length, `chips de rutas = ${ROUTES.length}`);
    await shot(page, "B7-otro-destino");
  });

  await saveRefs();
  // Los escenarios se cuentan aparte de `passes`: este suite verifica con `assert` (que lanza),
  // así que el contador de `check()` se quedaba en 0 y el resumen decía "0 OK / 0 FAIL".
  const escenariosOk = results.filter((r) => r.ok).length;
  console.log(`\nResultado navegador: ${escenariosOk} escenarios OK / ${failures} FAIL`);
  console.log(`Referencias acumuladas: ${refs.join(", ")}`);
  await browser.close();
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error("E2E-BROWSER fatal:", e);
  process.exit(1);
});