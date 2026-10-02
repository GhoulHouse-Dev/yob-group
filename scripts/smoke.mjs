import assert from "node:assert/strict";
const origin = process.env.YOB_SMOKE_ORIGIN;
if (!origin)
  throw new Error(
    "Set YOB_SMOKE_ORIGIN to an explicitly selected running preview.",
  );
const paths = [
  "/",
  "/palvelut",
  "/yritys",
  "/yhteys",
  "/tietosuoja",
  "/kiitos",
  ...[
    "injektointi",
    "vedeneristys",
    "rakennekorjaukset",
    "vaestonsuojat",
    "betonirakentaminen",
    "timanttityot",
    "saneeraukset",
  ].map((s) => "/palvelut/" + s),
];
for (const path of paths) {
  const res = await fetch(new URL(path, origin), {
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(res.status, 200, path);
  const html = await res.text();
  assert.equal(
    (html.match(/<h1[ >]/g) ?? []).length,
    1,
    `${path}: exactly one h1`,
  );
  assert.ok(html.includes('lang="fi"'), `${path}: Finnish language`);
  assert.ok(/noindex/.test(html), `${path}: preview must not be indexed`);
}
for (const path of [
  "/images/logo.jpg",
  "/images/injektointi.webp",
  "/images/vedeneristys.webp",
  "/images/betonirakentaminen.webp",
  "/fonts/inter-variable.woff2",
  "/favicon.svg",
]) {
  assert.equal(
    (await fetch(new URL(path, origin), { signal: AbortSignal.timeout(15000) }))
      .status,
    200,
    path,
  );
}
assert.equal(
  (
    await fetch(new URL("/palvelut/ei-olemassa", origin), {
      signal: AbortSignal.timeout(15000),
    })
  ).status,
  404,
);
const response = await fetch(new URL("/api/inquiries", origin), {
  method: "POST",
  headers: { Origin: origin },
  signal: AbortSignal.timeout(15000),
});
assert.equal(response.status, 503, "preview sending must remain disabled");
console.log(
  `Smoke checks passed: ${paths.length} pages, 6 assets, 404 and disabled API.`,
);
