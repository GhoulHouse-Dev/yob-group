import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname } from "node:path";
const require = createRequire(import.meta.url);
const root = dirname(process.env.YOB_TEST_MODULE);
const { quoteSchema, initialDetails, activeDetails } = require(`${root}/quote/schema.cjs`);
const { handleQuoteEstimate } = require(`${root}/quote/server.cjs`);
const { handleQuoteLead } = require(`${root}/quote/lead-server.cjs`);
const { handleQuoteUpload } = require(`${root}/quote/uploads.cjs`);
const { issueEstimateToken, readEstimateToken } = require(`${root}/quote/estimate-token.cjs`);
const { signToken, verifyToken, sessionCookie } = require(`${root}/quote/session.cjs`);
const { quoteEventSchema } = require(`${root}/quote/analytics.cjs`);
const { createQuoteStore, storageConfigured } = require(`${root}/quote/storage.cjs`);
const secret = "test-only-secret-with-at-least-32-characters";
const contact = { name: "Testi", phone: "", email: "test@example.com", location: "Testipaikka", description: "Testikohde",
  organization: "", service: "vedeneristys", date: "", website: "", preferredContact: "email" };
const quote = (service = "vedeneristys") => quoteSchema.parse({ service, propertyType: "Työmaa", customerType: "Yritys", details: activeDetails(service, initialDetails(service)) });
const estimate = { status: "manual_quote", reason: "pricing_unavailable" };
const payload = (overrides = {}) => ({ contact, quote: quote(), estimateToken: issueEstimateToken(quote(), estimate, secret), attachments: [], ...overrides });
function request(path, body, headers = {}) {
  const multipart = body instanceof FormData;
  return new Request(`https://example.com/api/${path}`, { method: "POST", headers: { Origin: "https://example.com",
    "Idempotency-Key": "0123456789abcdef0123456789abcdef", ...(!multipart ? { "Content-Type": "application/json" } : {}), ...headers },
    body: multipart ? body : JSON.stringify(body) });
}
function memoryStore() {
  const records = new Map();
  return { records, async get(k) { return records.get(k) ?? null; }, async put(k, v, only = false) {
    if (only && records.has(k)) return false;
    records.set(k, structuredClone(v)); return true;
  } };
}
const config = (store) => ({ enabled: true, apiKey: "fake", from: "from@example.com", to: "to@example.com", secret, store });
const noEmail = async () => { throw new Error("Email must not run"); };
const uploadRequest = (files, headers = {}) => {
  const form = new FormData(); for (const f of files) form.append("files", f); return request("quote-uploads", form, headers);
};
const png = () => new File([new Uint8Array([137,80,78,71,13,10,26,10])], "test.png", { type: "image/png" });

test("all services return a manual result without contact data or fallback prices", async () => {
  for (const service of ["injektointi", "vedeneristys", "timanttityot", "rakennekorjaukset", "vaestonsuojat", "betonirakentaminen", "saneeraukset", "unknown"]) {
    const response = await handleQuoteEstimate(request("quote-estimate", quote(service)), secret);
    const body = await response.json();
    assert.equal(response.status, 200); assert.equal(body.estimate.status, "manual_quote");
    assert.equal("minPrice" in body.estimate, false); assert.ok(body.estimateToken);
  }
  for (const extra of [{ email: "sensitive@example.com" }, { minPrice: 1 }, { attachments: [] }])
    assert.equal((await handleQuoteEstimate(request("quote-estimate", { ...quote(), ...extra }), secret)).status, 422);
});
test("estimate token rejects changed measurements, prices, MAC, expiry and wrong secret", () => {
  const token = issueEstimateToken(quote(), estimate, secret);
  assert.deepEqual(readEstimateToken(token, quote(), secret), estimate);
  const altered = { ...quote(), details: { ...quote().details, area: 9 } };
  assert.throws(() => readEstimateToken(token, altered, secret));
  assert.throws(() => readEstimateToken(token, quote(), "wrong-secret"));
  const [content, mac] = token.split(".");
  const fake = JSON.parse(Buffer.from(content, "base64url")); fake.estimate = { status: "estimated", minPrice: 1, maxPrice: 2, vatIncluded: true };
  assert.throws(() => readEstimateToken(`${Buffer.from(JSON.stringify(fake)).toString("base64url")}.${mac}`, quote(), secret));
  const now = Date.now; Date.now = () => now() + 7201 * 1000;
  try { assert.throws(() => readEstimateToken(token, quote(), secret)); } finally { Date.now = now; }
});
test("upload is optional and disabled preview never reads or writes storage", async () => {
  const response = await handleQuoteUpload(uploadRequest([png()]), { enabled: false, secret, store: { async put() { throw new Error("must not write"); } } });
  assert.equal(response.status, 503);
  const store = memoryStore();
  const result = await handleQuoteLead(request("inquiries", payload()), config(store), async () => Response.json({ id: "fake-id" }));
  assert.equal(result.status, 200); assert.equal(store.records.size, 1);
});
test("upload validates content, bounds, origin and returns IDs only", async () => {
  const store = memoryStore(); const cfg = { enabled: true, secret, store };
  assert.equal((await handleQuoteUpload(uploadRequest([new File(["fake png"], "x.png", { type: "image/png" })]), cfg)).status, 422);
  assert.equal((await handleQuoteUpload(uploadRequest([png()], { Origin: "https://attacker.example" }), cfg)).status, 403);
  assert.equal((await handleQuoteUpload(uploadRequest([png(), png(), png(), png()]), cfg)).status, 422);
  assert.equal((await handleQuoteUpload(uploadRequest([new File([new Uint8Array(3 * 1024 * 1024 + 1)], "x.png", { type: "image/png" })]), cfg)).status, 422);
  const response = await handleQuoteUpload(uploadRequest([png()]), cfg);
  assert.equal(response.status, 200); const body = await response.json();
  assert.deepEqual(Object.keys(body.attachments[0]), ["id"]); assert.match(response.headers.get("set-cookie"), /HttpOnly; SameSite=Strict.*Secure/);
});
test("attachment ownership and unknown file IDs are checked before email", async () => {
  const store = memoryStore();
  const upload = await handleQuoteUpload(uploadRequest([png()]), { enabled: true, secret, store });
  const refs = (await upload.json()).attachments;
  assert.equal((await handleQuoteLead(request("inquiries", payload({ attachments: refs })), config(store), noEmail)).status, 422);
  const cookie = upload.headers.get("set-cookie").split(";")[0];
  const foreign = `${sessionCookie}=${signToken("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", secret)}`;
  assert.equal((await handleQuoteLead(request("inquiries", payload({ attachments: refs }), { Cookie: foreign }), config(store), noEmail)).status, 422);
  const unknown = [{ id: "f".repeat(64) }];
  assert.equal((await handleQuoteLead(request("inquiries", payload({ attachments: unknown }), { Cookie: cookie }), config(store), noEmail)).status, 422);
  let email;
  const response = await handleQuoteLead(request("inquiries", payload({ attachments: refs }), { Cookie: cookie }), config(store), async (_url, options) => {
    email = JSON.parse(options.body); return Response.json({ id: "fake-provider-id" });
  });
  assert.equal(response.status, 200); assert.equal(email.attachments.length, 1);
  const record = [...store.records.entries()].find(([key]) => key.startsWith("quote-leads/"))[1];
  assert.equal(record.attachments[0].content, email.attachments[0].content); assert.equal(record.delivered, true);
});
test("client prices, arbitrary file URLs and extra contact properties are rejected", async () => {
  const store = memoryStore();
  for (const value of [payload({ estimate: { min: 1, max: 1 } }), payload({ attachments: [{ id: "f".repeat(64), url: "https://attacker.example" }] }),
    payload({ contact: { ...contact, rate: 1 } }), payload({ contact: { ...contact, service: "injektointi" } })])
    assert.equal((await handleQuoteLead(request("inquiries", value), config(store), noEmail)).status, 422);
  assert.equal(store.records.size, 0);
});
test("lead is durable before email; retry is idempotent and receipt cannot be forged with upload session", async () => {
  const store = memoryStore(); let sends = 0;
  const value = payload(); const transport = async () => {
    sends++; assert.ok([...store.records.keys()].some((k) => k.startsWith("quote-leads/")));
    return Response.json({ id: "fake-email-id" });
  };
  const first = await handleQuoteLead(request("inquiries", value), config(store), transport);
  const second = await handleQuoteLead(request("inquiries", value), config(store), transport);
  assert.equal(first.status, 200); assert.equal(second.status, 200); assert.equal(sends, 1);
  const cookie = first.headers.get("set-cookie").split(";")[0].split("=")[1];
  assert.ok(verifyToken(cookie, secret, "receipt")); assert.equal(verifyToken(cookie, secret, "session"), null);
  const session = signToken("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", secret);
  assert.equal(verifyToken(session, secret, "receipt"), null);
  assert.equal((await handleQuoteLead(request("inquiries", payload({ contact: { ...contact, name: "Different" } })), config(store), transport)).status, 409);
});
test("storage and provider failures never return success; provider retry preserves key", async () => {
  const broken = { async get() { return null; }, async put() { throw new Error("down"); } };
  assert.equal((await handleQuoteLead(request("inquiries", payload()), config(broken), noEmail)).status, 502);
  const store = memoryStore(); const value = payload(); let key;
  const first = await handleQuoteLead(request("inquiries", value), config(store), async (_url, options) => { key = options.headers["Idempotency-Key"]; return new Response(null, { status: 500 }); });
  assert.equal(first.status, 502); assert.equal([...store.records.values()][0].delivered, false);
  const second = await handleQuoteLead(request("inquiries", value), config(store), async (_url, options) => { assert.equal(options.headers["Idempotency-Key"], key); return Response.json({ id: "fake-id" }); });
  assert.equal(second.status, 200);
});
test("event schema accepts only funnel metadata and rejects personal data", () => {
  const data = { event: "quote_started", service: "unknown", step: 1, preview: false };
  assert.equal(quoteEventSchema.safeParse(data).success, true);
  for (const extra of [{ email: "private@example.com" }, { description: "sensitive" }, { filename: "private.png" }, { sessionId: "identity" }])
    assert.equal(quoteEventSchema.safeParse({ ...data, ...extra }).success, false);
});
test("S3 adapter uses signed private requests, conditional creation and safe endpoint keys", async () => {
  const env = { QUOTE_S3_ENDPOINT: "https://storage.example.com", QUOTE_S3_BUCKET: "quote-bucket", QUOTE_S3_REGION: "eu-north-1",
    QUOTE_S3_ACCESS_KEY_ID: "fake-access", QUOTE_S3_SECRET_ACCESS_KEY: "fake-secret", QUOTE_SESSION_SECRET: secret };
  assert.equal(storageConfigured(env), true); assert.equal(storageConfigured({ ...env, QUOTE_SESSION_SECRET: "short" }), false);
  let observed;
  const store = createQuoteStore(env, async (url, init) => { observed = { url: String(url), ...init }; return new Response(null, { status: 412 }); });
  assert.equal(await store.put("quote-leads/test.json", { safe: true }, true), false);
  assert.equal(observed.url, "https://storage.example.com/quote-bucket/quote-leads/test.json");
  assert.match(observed.headers.authorization, /^AWS4-HMAC-SHA256 /); assert.equal(observed.headers["if-none-match"], "*");
  assert.equal(observed.redirect, "error");
  await assert.rejects(() => store.get("../../secrets.json"));
  assert.throws(() => createQuoteStore({ ...env, QUOTE_S3_ENDPOINT: "http://storage.example.com" }));
});
