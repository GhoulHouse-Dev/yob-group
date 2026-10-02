import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname } from "node:path";
const require = createRequire(import.meta.url);
const output = dirname(process.env.YOB_TEST_MODULE);
const { quoteSchema, initialDetails, activeDetails } = require(`${output}/quote/schema.cjs`);
const { handleQuoteEstimate } = require(`${output}/quote/server.cjs`);
const { handleInquiry } = require(process.env.YOB_TEST_MODULE);
const { isSameOrigin } = require(`${output}/request-origin.cjs`);
const enabled = { enabled: true, apiKey: "test-key", from: "test@example.com", to: "test@example.com" };
const quote = (service = "unknown", details = initialDetails(service)) => ({
  service, propertyType: "Työmaa", customerType: "Yritys", details: activeDetails(service, details),
});
function estimateRequest(body, extra = {}) {
  return new Request("https://example.com/api/quote-estimate", { method: "POST", headers: {
    Origin: "https://example.com", "Content-Type": "application/json", ...extra,
  }, body: JSON.stringify(body) });
}
function inquiryRequest(payload, overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ name: "Testi", phone: "", email: "test@example.com", location: "Testipaikka",
    description: "Testikuvaus", organization: "", service: payload.service, date: "", website: "",
    quoteDetails: JSON.stringify(payload), ...overrides,
  })) data.set(key, value);
  return new Request("https://example.com/api/inquiries", { method: "POST", headers: { Origin: "https://example.com" }, body: data });
}
test("each service accepts unknown dimensions without inventing a quantity", () => {
  for (const service of ["injektointi", "vedeneristys", "timanttityot", "rakennekorjaukset", "vaestonsuojat", "betonirakentaminen", "saneeraukset", "unknown"])
    assert.equal(quoteSchema.safeParse(quote(service)).success, true, service);
});
test("Finnish decimal input becomes a numeric area and invalid quantities fail", () => {
  const details = initialDetails("vedeneristys");
  assert.equal(quoteSchema.parse(quote("vedeneristys", { ...details, area: "12,5" })).details.area, 12.5);
  for (const area of ["", "0", "-1", "Infinity", "1e309", "9999999999"])
    assert.equal(quoteSchema.safeParse(quote("vedeneristys", { ...details, area })).success, false);
});
test("drilling and sawing use different dimensions and reject stale hidden fields", () => {
  const drilling = { work: "Timanttiporaus", material: "Betoni", thickness: "150", count: "2", diameter: "100" };
  assert.equal(quoteSchema.parse(quote("timanttityot", drilling)).details.count, 2);
  assert.equal(quoteSchema.safeParse(quote("timanttityot", { ...drilling, count: "1,5" })).success, false);
  const sawing = quote("timanttityot", { ...drilling, work: "Timanttisahaus", length: "2,5" });
  assert.equal(quoteSchema.parse(sawing).details.length, 2.5);
  assert.equal("count" in sawing.details, false);
  assert.equal(quoteSchema.safeParse({ ...sawing, details: { ...sawing.details, count: 999 } }).success, false);
});
test("estimate never returns fictional euro amounts and rejects submitted prices", async () => {
  const response = await handleQuoteEstimate(estimateRequest(quote()));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.estimate.kind, "quote_only");
  assert.equal(body.estimate.reason, "no_tariff");
  assert.equal("minCents" in body.estimate, false);
  assert.equal((await handleQuoteEstimate(estimateRequest({ ...quote(), price: 1 }))).status, 422);
});
test("estimate checks origin, malformed JSON and bounded request body", async () => {
  assert.equal((await handleQuoteEstimate(estimateRequest(quote(), { Origin: "https://other.example" }))).status, 403);
  assert.equal((await handleQuoteEstimate(estimateRequest(quote(), { "Content-Type": "text/plain" }))).status, 415);
  assert.equal((await handleQuoteEstimate(estimateRequest({ data: "x".repeat(17000) }))).status, 413);
  const malformed = new Request("https://example.com/api/quote-estimate", { method: "POST",
    headers: { Origin: "https://example.com", "Content-Type": "application/json" }, body: "{" });
  assert.equal((await handleQuoteEstimate(malformed)).status, 422);
});
test("mail summary is formed from validated dimensions and matches selected service", async () => {
  let sent;
  const payload = quote("vedeneristys", { ...initialDetails("vedeneristys"), area: "12,5" });
  const response = await handleInquiry(inquiryRequest(payload), enabled, async (_url, options) => {
    sent = JSON.parse(options.body); return Response.json({ id: "test-id" });
  });
  assert.equal(response.status, 200);
  assert.match(sent.text, /12,5 m²/);
  assert.match(sent.text, /Euromääräistä arviota ei ole laskettu/);
  const forbidden = async () => { throw new Error("Provider must not run"); };
  for (const override of [{ service: "injektointi" }, { quoteDetails: "{" }, { quoteDetails: JSON.stringify({ ...payload, total: 1 }) }])
    assert.equal((await handleInquiry(inquiryRequest(payload, override), enabled, forbidden)).status, 422);
});
test("selected contact method and real calendar dates are checked", async () => {
  const forbidden = async () => { throw new Error("Provider must not run"); };
  for (const override of [{ preferredContact: "phone", phone: "" }, { date: "2026-02-30" }, { date: "2026-13-01" }])
    assert.equal((await handleInquiry(inquiryRequest(quote(), override), enabled, forbidden)).status, 422);
});
test("origin compares the browser destination Host while preserving scheme and cross-origin checks", () => {
  const req = (origin, host = "example.com") => new Request("https://0.0.0.0:3000/api/inquiries", {
    headers: { Origin: origin, Host: host },
  });
  assert.equal(isSameOrigin(req("https://example.com")), true);
  assert.equal(isSameOrigin(req("https://attacker.example")), false);
  assert.equal(isSameOrigin(req("http://example.com")), false);
  assert.equal(isSameOrigin(req("https://example.com", "attacker.example")), false);
  assert.equal(isSameOrigin(req("https://example.com", "example.com/invalid")), false);
  assert.equal(isSameOrigin(new Request("https://example.com/api/inquiries")), false);
});
