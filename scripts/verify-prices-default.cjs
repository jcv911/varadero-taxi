// Verifies: (1) new sedan prices render, (2) the summary always opens on the sedan
// even when localStorage holds a previously selected van.
const { chromium } = require("playwright");
const URL = process.env.URL || "http://localhost:3112/es";

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const route of [/Hacia Aeropuerto/i, /Hacia La Habana/i]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1300);

    const b = page.getByRole("button", { name: route }).first();
    await b.click().catch(() => {});
    await page.waitForTimeout(800);

    // Summary bar: what vehicle + price does it show right after picking the route?
    const summary = await page.evaluate(() => {
      const el = document.getElementById("booking-summary");
      if (!el) return null;
      return {
        text: el.innerText.replace(/\s+/g, " ").trim(),
        price: (el.innerText.match(/\$\s?\d+/) || [])[0] || null,
      };
    });

    // Vehicle cards on step 3 with their prices
    await page.getByRole("button", { name: /^Continuar$/i }).first().click().catch(() => {});
    await page.waitForTimeout(500);
    const day = page.locator("button:not([disabled])").filter({ hasText: /^\d{1,2}$/ });
    const n = await day.count();
    if (n) { await day.nth(Math.min(1, n - 1)).click().catch(() => {}); await page.waitForTimeout(350); }
    await page.getByRole("button", { name: /^Continuar$/i }).first().click().catch(() => {});
    await page.waitForTimeout(700);

    const cards = await page.evaluate(() => {
      const out = [];
      for (const btn of document.querySelectorAll("button")) {
        const t = btn.innerText || "";
        if (!/sed[aá]n|suv|minivan|van/i.test(t)) continue;
        const m = t.match(/\$\s?\d+/g);
        out.push({ v: t.split("\n")[0].trim().slice(0, 14), prices: m || [] });
      }
      return out;
    });

    results.push({ route: String(route), summary, cards });
    await ctx.close();
  }

  // Part 2: stale localStorage must not resurrect the van
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const p2 = await ctx2.newPage();
  await p2.goto(URL, { waitUntil: "domcontentloaded" });
  await p2.evaluate(() => {
    localStorage.setItem("varadero-booking", JSON.stringify({ state: { mode: "trip", vehicleId: "van", name: "X", whatsapp: "+5358117692", email: "" }, version: 1 }));
  });
  await p2.reload({ waitUntil: "domcontentloaded" });
  await p2.waitForTimeout(1600);
  const stale = await p2.evaluate(() => {
    const el = document.getElementById("booking-summary");
    return { summary: el ? el.innerText.replace(/\s+/g, " ").trim() : null,
             stored: localStorage.getItem("varadero-booking") };
  });
  await browser.close();

  console.log(JSON.stringify({ results, staleStorage: stale }, null, 1));
})();
