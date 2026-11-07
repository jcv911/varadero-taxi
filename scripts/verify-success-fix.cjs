// Verify the success card is fully reachable at every phone size, using a LOCAL
// build of the fixed code. Asserts: card fits OR scrolls, and the last button
// (nueva reserva) is reachable by scrolling the card itself.
const { chromium } = require("playwright");
const URL = process.env.URL || "http://localhost:3111/es";
const SHOTS = process.env.TMPDIR || "C:/Users/jonny/AppData/Local/hermes/cache/scratch";
const SIZES = [[320, 568], [360, 640], [375, 667], [390, 844], [414, 896], [360, 800]];

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  for (const [W, H] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.route("**/api/bookings", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ref: "VT-4242", priceUsd: 90 }) })
    );
    await page.goto(URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1300);

    const hit = async (re) => {
      const b = page.getByRole("button", { name: re }).first();
      if (!(await b.count())) return false;
      await b.scrollIntoViewIfNeeded().catch(() => {});
      await b.click({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(600);
      return true;
    };
    await hit(/Hacia La Habana/i);
    await hit(/^Continuar$/i);
    const day = page.locator("button:not([disabled])").filter({ hasText: /^\d{1,2}$/ });
    const n = await day.count();
    if (n) { await day.nth(Math.min(1, n - 1)).click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(350); }
    await hit(/^Continuar$/i);
    await hit(/Van|Minivan/i);
    await hit(/^Continuar$/i);
    await hit(/^Continuar$/i);

    await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const set = (el, v) => {
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      };
      for (const [k, v] of Object.entries({ name: "Maria de los Angeles Rodriguez Fernandez", whatsapp: "+5358117692", email: "maria@correo.com", hotelPickup: "Hotel Iberostar Grand Packard Playa Varadero Resort", flightNumber: "CU1234" })) {
        const el = document.querySelector("#" + k);
        if (el) set(el, v);
      }
      const cb = document.querySelector('input[type="checkbox"]');
      if (cb && !cb.checked) cb.click();
      await sleep(300);
      const s = [...document.querySelectorAll("button")].find((b) => /enviar solicitud/i.test(b.innerText || ""));
      if (s) s.click();
      await sleep(2600);
    });

    const r = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const wa = [...document.querySelectorAll("a")].find((a) => (a.getAttribute("href") || "").includes("wa.me"));
      const card = wa ? wa.closest("[class*='rounded-card']") : null;
      if (!card) return { found: false };
      const cs = getComputedStyle(card);
      const before = { scrollTop: card.scrollTop, scrollH: card.scrollHeight, clientH: card.clientHeight, canScroll: cs.overflowY === "auto" || cs.overflowY === "scroll" };
      // scroll the card to the bottom
      card.scrollTop = card.scrollHeight;
      await sleep(400);
      const nb = [...card.querySelectorAll("button")].pop();
      const wb = nb ? nb.getBoundingClientRect() : null;
      const cr = card.getBoundingClientRect();
      const after = {
        scrollTop: Math.round(card.scrollTop),
        lastBtnText: nb ? nb.innerText.slice(0, 24) : null,
        lastBtnBottom: wb ? Math.round(wb.bottom) : null,
        cardBottom: Math.round(cr.bottom),
        lastBtnInsideCard: wb ? wb.bottom <= cr.bottom + 1 : false,
        lastBtnInViewport: wb ? wb.bottom <= window.innerHeight + 1 && wb.top >= -1 : false,
      };
      return { found: true, cardH: Math.round(cr.height), vh: window.innerHeight, ...before, ...after,
        docH: document.documentElement.scrollHeight, hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
    });

    const ok = r.found && r.lastBtnInsideCard;
    if (!ok) failures++;
    console.log(`${W}x${H}  cardH=${r.cardH} vh=${r.vh} scrolls=${r.canScroll} scrollH=${r.scrollH}/${r.clientH}  lastBtn("${r.lastBtnText}") dentro=${r.lastBtnInsideCard} visibleEnPantalla=${r.lastBtnInViewport}  => ${ok ? "OK" : "FALLA"}`);
    await page.screenshot({ path: `${SHOTS}/fix-${W}x${H}.png` });
    await ctx.close();
  }
  await browser.close();
  console.log(failures === 0 ? "\nTODAS LAS PANTALLAS OK" : `\n${failures} PANTALLA(S) CON FALLO`);
  process.exit(failures === 0 ? 0 : 1);
})();
