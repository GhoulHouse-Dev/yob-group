import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.YOB_PLAYWRIGHT_MODULE || "playwright");
const origin = "http://127.0.0.1:3017";
const output = ".sites-runtime/browser-qa";
const results = [];
const services = ["injektointi", "vedeneristys", "rakennekorjaukset", "vaestonsuojat", "betonirakentaminen", "timanttityot", "saneeraukset", "unknown"];
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3017"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, LEAD_INTAKE_ENABLED: "false", QUOTE_ANALYTICS_ENABLED: "false" },
});
let browser;
let currentPage;
let serverLog = "";
server.stdout.on("data", (data) => { serverLog += data.toString(); });
server.stderr.on("data", (data) => { serverLog += data.toString(); });

async function startup() {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${serverLog}`);
    try { if ((await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok) return; } catch { /* Await readiness. */ }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Server startup timed out: ${serverLog}`);
}
async function fits(page, label) {
  const dimensions = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(Math.max(dimensions.document, dimensions.body) <= dimensions.width + 1, `${label}: horizontal overflow ${JSON.stringify(dimensions)}`);
  const clipped = await page.locator(".quote-calculator input, .quote-calculator select, .quote-calculator textarea, .quote-actions button").evaluateAll((elements) => elements.filter((el) => {
    if (el.closest(".honeypot") || !el.getClientRects().length) return false;
    const r = el.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
  }).map((el) => el.id || el.textContent));
  assert.deepEqual(clipped, [], `${label}: clipped controls`);
}
async function progress(form, step) {
  await form.locator(".quote-progress").filter({ hasText: `Vaihe ${step} / 5` }).waitFor();
}
async function journey(page, path, service, width, drilling = false) {
  const requests = [];
  const errors = [];
  const onRequest = (req) => { if (req.url().includes("/api/")) requests.push(req); };
  const onError = (error) => errors.push(error.message);
  const onConsole = (msg) => { if (msg.type() === "error") errors.push(msg.text()); };
  page.on("request", onRequest); page.on("pageerror", onError); page.on("console", onConsole);
  try {
    await page.goto(origin + path);
    const form = page.getByRole("form", { name: "Tarjouspyyntölaskuri" });
    await form.waitFor();
    // Prove hydration using visible state before proceeding.
    await form.getByRole("button", { name: "Jatka", exact: true }).click();
    await form.getByRole("alert").filter({ hasText: "Valitse työ" }).waitFor();
    await fits(page, `${width} ${path} initial`);
    await form.locator(`input[value="${service}"]`).check();
    await form.getByRole("button", { name: "Jatka", exact: true }).click();
    await progress(form, 2);
    await form.getByRole("button", { name: "Jatka", exact: true }).click();
    await form.getByRole("alert").filter({ hasText: "Kirjoita kohteen paikkakunta" }).waitFor();
    await form.getByLabel("Kohteen paikkakunta *", { exact: true }).fill("Testipaikkakunta");
    if (service === "timanttityot" && drilling) await form.getByLabel("Tarvittava työ", { exact: true }).selectOption("Timanttiporaus");
    await fits(page, `${width} ${path} ${service} step 2`);
    await form.getByRole("button", { name: "Jatka", exact: true }).click();
    await progress(form, 3);
    if (service === "vedeneristys") {
      await form.getByLabel("En tiedä mittaa", { exact: true }).uncheck();
      await form.getByLabel("Arvioitu pinta-ala (m²)", { exact: true }).fill("0");
      await form.getByRole("button", { name: "Jatka", exact: true }).click();
      await form.getByRole("alert").filter({ hasText: "Anna positiivinen mitta" }).waitFor();
      await form.getByLabel("Arvioitu pinta-ala (m²)", { exact: true }).fill("12,5");
    }
    await fits(page, `${width} ${path} ${service} step 3`);
    await form.getByRole("button", { name: "Jatka", exact: true }).click();
    await progress(form, 4);
    await form.getByLabel("Kohde ja korjaustarve *", { exact: true }).fill("Testikuvaus. Testissä ei lähetetä oikeaa yhteydenottoa.");
    if (service === "unknown") await form.locator('input[type="file"]').setInputFiles({
      name: "test-only.png", mimeType: "image/png", buffer: Buffer.from([137,80,78,71,13,10,26,10]),
    });
    await fits(page, `${width} ${path} ${service} step 4`);
    await form.getByRole("button", { name: "Katso arvio", exact: true }).click();
    await progress(form, 5);
    await form.locator(".quote-price").filter({ hasText: "Hinta vahvistetaan kohdekohtaisesti" }).waitFor();
    assert.equal(await form.getByLabel("Nimi *", { exact: true }).count(), 0, "Contacts must be hidden until after estimate");
    if (service === "vedeneristys") assert.match(await form.locator(".quote-summary").innerText(), /12,5 m²/);
    await fits(page, `${width} ${path} ${service} estimate`);
    await form.getByRole("button", { name: "Pyydä tarkka tarjous", exact: true }).click();
    await form.getByLabel("Nimi *", { exact: true }).fill("Testihenkilö");
    await form.getByLabel("Sähköposti *", { exact: true }).fill("test@example.com");
    await fits(page, `${width} ${path} ${service} contacts`);
    await form.getByRole("button", { name: "Tarkista tarjouspyyntö", exact: true }).click();
    await form.getByRole("alert").filter({ hasText: "tietojasi ei ole lähetetty YOB:lle" }).waitFor();
    assert.equal(page.url(), origin + path);
    const estimates = requests.filter((req) => req.url().endsWith("/api/quote-estimate"));
    assert.equal(estimates.length, 1);
    const input = estimates[0].postDataJSON();
    assert.deepEqual(Object.keys(input).sort(), ["customerType", "details", "propertyType", "service"]);
    assert.equal(JSON.stringify(input).includes("test@example.com"), false);
    assert.equal(requests.some((req) => /\/(inquiries|quote-uploads|quote-events)$/.test(req.url())), false, "Preview must never upload or send a lead");
    const events = await page.evaluate(() => window.__yobTestEvents);
    for (const event of ["quote_started", "quote_manual_required", "quote_contact_started"])
      assert.equal(events.filter((v) => v.event === event).length, 1, event);
    assert.equal(events.some((v) => v.event === "quote_submitted"), false);
    assert.deepEqual(errors, [], "Browser runtime errors");
    results.push({ path, service, width, status: "pass" });
    console.log(`PASS ${width}px ${path} ${service}${drilling ? " drilling" : ""}`);
  } finally { page.off("request", onRequest); page.off("pageerror", onError); page.off("console", onConsole); }
}

try {
  await mkdir(output, { recursive: true });
  await startup();
  browser = await chromium.launch({ headless: true });
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(() => {
      window.__yobTestEvents = [];
      window.addEventListener("yob:quote", (e) => window.__yobTestEvents.push(e.detail));
    });
    currentPage = await context.newPage();
    for (const path of ["/", "/tarjouspyynto"]) {
      for (const service of services) await journey(currentPage, path, service, width);
      await journey(currentPage, path, "timanttityot", width, true);
      await currentPage.screenshot({ path: `${output}/contacts-${width}-${path === "/" ? "home" : "page"}.png`, fullPage: true });
    }
    await currentPage.goto(origin);
    const menu = currentPage.getByRole("button", { name: "Valikko", exact: true });
    if (await menu.isVisible()) {
      await menu.click();
      const nav = currentPage.getByRole("navigation", { name: "Mobiilinavigaatio" });
      await nav.getByRole("link", { name: "Tarjouslaskuri", exact: true }).click();
      await currentPage.waitForURL(origin + "/tarjouspyynto");
      await nav.waitFor({ state: "hidden" });
      await fits(currentPage, `${width} mobile navigation`);
    }
    await context.close();
  }
  console.log(`Browser QA passed: ${results.length} journeys at 320/390/768/1440 px.`);
} catch (error) {
  if (currentPage && !currentPage.isClosed()) await currentPage.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  await writeFile(`${output}/server.log`, serverLog);
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
