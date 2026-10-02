import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";

// Compile only the mail boundary and shared schemas. No Worker or email service
// is started during tests, and every provider call uses an injected fake.
const output = resolve(".sites-runtime/unit-tests");
mkdirSync(output, { recursive: true });
for (const name of ["site", "inquiry", "inquiry-server", "request-origin", "quote/questions", "quote/schema", "quote/summary", "quote/types", "quote/pricing", "quote/server", "quote/storage", "quote/session", "quote/uploads", "quote/body", "quote/estimate-token", "quote/lead-schema", "quote/lead-server", "quote/analytics"]) {
  const source = readFileSync(`lib/${name}.ts`, "utf8");
  const compiled = ts
    .transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    })
    .outputText.replace(/require\("server-only"\);/g, "").replace(
      /require\("(\.\.?\/[^\"]+)"\)/g,
      'require("$1.cjs")',
    );
  mkdirSync(dirname(`${output}/${name}.cjs`), { recursive: true });
  writeFileSync(`${output}/${name}.cjs`, compiled);
}
const result = spawnSync(
  process.execPath,
  ["--test", "tests/inquiry.test.mjs", "tests/quote.test.mjs", "tests/quote-pipeline.test.mjs"],
  {
    stdio: "inherit",
    env: { ...process.env, YOB_TEST_MODULE: `${output}/inquiry-server.cjs` },
  },
);
process.exit(result.status ?? 1);
