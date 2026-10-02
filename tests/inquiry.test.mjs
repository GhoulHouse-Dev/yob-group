import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { handleInquiry } = require(process.env.YOB_TEST_MODULE);
const enabled = {
  enabled: true,
  apiKey: "test-key",
  from: "test@example.com",
  to: "receiver@example.com",
};
const fields = {
  name: "Testihenkilö",
  phone: "",
  email: "test@example.com",
  location: "Testipaikkakunta",
  description: "Testikohde.",
  organization: "",
  service: "unknown",
  date: "",
  website: "",
};
function request(overrides = {}, files = [], headers = {}) {
  const body = new FormData();
  for (const [key, value] of Object.entries({ ...fields, ...overrides }))
    body.set(key, value);
  for (const file of files) body.append("attachments", file);
  return new Request("https://example.com/api/inquiries", {
    method: "POST",
    headers: {
      Origin: "https://example.com",
      "Idempotency-Key": "0123456789abcdef0123456789abcdef",
      ...headers,
    },
    body,
  });
}
const forbiddenTransport = async () => {
  throw new Error("The provider must not be called");
};

test("preview returns 503 and never sends a lead", async () => {
  const res = await handleInquiry(
    request(),
    { ...enabled, enabled: false },
    forbiddenTransport,
  );
  assert.equal(res.status, 503);
  assert.equal((await res.json()).ok, false);
});
test("missing delivery secret fails closed", async () => {
  assert.equal(
    (
      await handleInquiry(
        request(),
        { ...enabled, apiKey: undefined },
        forbiddenTransport,
      )
    ).status,
    503,
  );
});
test("cross-origin and missing-origin requests are rejected", async () => {
  assert.equal(
    (
      await handleInquiry(
        request({}, [], { Origin: "https://attacker.example" }),
        enabled,
        forbiddenTransport,
      )
    ).status,
    403,
  );
  const req = request();
  req.headers.delete("origin");
  assert.equal(
    (await handleInquiry(req, enabled, forbiddenTransport)).status,
    403,
  );
});
test("incorrect content type is rejected", async () => {
  const req = new Request("https://example.com/api/inquiries", {
    method: "POST",
    headers: {
      Origin: "https://example.com",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(
    (await handleInquiry(req, enabled, forbiddenTransport)).status,
    415,
  );
});
test("at least one reachable contact channel is required", async () => {
  const res = await handleInquiry(
    request({ phone: "", email: "" }),
    enabled,
    forbiddenTransport,
  );
  assert.equal(res.status, 422);
  assert.ok((await res.json()).errors.phone);
});
test("invalid email, unknown service and honeypot are rejected", async () => {
  for (const invalid of [
    { email: "invalid" },
    { service: "not-a-service" },
    { website: "bot" },
  ]) {
    assert.equal(
      (await handleInquiry(request(invalid), enabled, forbiddenTransport))
        .status,
      422,
    );
  }
});
test("attachments reject excessive count, size and disallowed types", async () => {
  const png = () => new File(["image"], "test.png", { type: "image/png" });
  for (const files of [
    Array.from({ length: 4 }, png),
    [
      new File([new Uint8Array(3 * 1024 * 1024 + 1)], "big.pdf", {
        type: "application/pdf",
      }),
    ],
    [new File(["exe"], "test.exe", { type: "application/octet-stream" })],
  ]) {
    assert.equal(
      (await handleInquiry(request({}, files), enabled, forbiddenTransport))
        .status,
      422,
    );
  }
});
test("oversized body is rejected before provider delivery", async () => {
  assert.equal(
    (
      await handleInquiry(
        request({}, [], { "Content-Length": String(10 * 1024 * 1024) }),
        enabled,
        forbiddenTransport,
      )
    ).status,
    413,
  );
});
test("successful provider acknowledgement preserves retry key and sends a safe text payload", async () => {
  let sent;
  const transport = async (_url, options) => {
    sent = options;
    return Response.json({ id: "fake-provider-id" });
  };
  const res = await handleInquiry(request(), enabled, transport);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ok, true);
  assert.equal(
    sent.headers["Idempotency-Key"],
    "yob-inquiry-0123456789abcdef0123456789abcdef",
  );
  const payload = JSON.parse(sent.body);
  assert.deepEqual(payload.to, ["receiver@example.com"]);
  assert.equal(payload.reply_to, "test@example.com");
  assert.ok(payload.text.includes("Testikohde."));
  assert.equal(payload.html, undefined);
});
test("phone-only inquiry is accepted without reply_to", async () => {
  let payload;
  const res = await handleInquiry(
    request({ email: "", phone: "+358 40 123 4567" }),
    enabled,
    async (_url, options) => {
      payload = JSON.parse(options.body);
      return Response.json({ id: "fake-id" });
    },
  );
  assert.equal(res.status, 200);
  assert.equal(payload.reply_to, undefined);
});
test("provider errors and missing acknowledgements never show success", async () => {
  for (const transport of [
    async () => new Response("error", { status: 500 }),
    async () => Response.json({}),
    async () => {
      throw new Error("network");
    },
  ]) {
    const res = await handleInquiry(request(), enabled, transport);
    assert.equal(res.status, 502);
    assert.equal((await res.json()).ok, false);
  }
});
test("malformed idempotency key is rejected", async () => {
  assert.equal(
    (
      await handleInquiry(
        request({}, [], { "Idempotency-Key": "invalid" }),
        enabled,
        forbiddenTransport,
      )
    ).status,
    400,
  );
});
test("combined attachment size above 3 MiB is rejected below the request body limit", async () => {
  const files = [1, 2].map(
    (i) =>
      new File(
        [new Uint8Array(Math.ceil(1.6 * 1024 * 1024))],
        `test-${i}.pdf`,
        { type: "application/pdf" },
      ),
  );
  const res = await handleInquiry(request({}, files), enabled, forbiddenTransport);
  assert.equal(res.status, 422);
  assert.match((await res.json()).errors.attachments, /3 Mt/);
});
