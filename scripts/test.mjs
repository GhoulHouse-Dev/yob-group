import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";

// Compile only the mail boundary and shared schemas. No Worker or email service
// is started during tests, and every provider call uses an injected fake.
const output = resolve(".sites-runtime/unit-tests");
mkdirSync(output, { recursive: true });
for (const name of ["site", "inquiry", "inquiry-server"]) {
  const source = readFileSync(`lib/${name}.ts`, "utf8");
  const compiled = ts
    .transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    })
    .outputText.replace(
      /require\("\.\/(site|inquiry)"\)/g,
      'require("./$1.cjs")',
    );
  writeFileSync(`${output}/${name}.cjs`, compiled);
}
const result = spawnSync(
  process.execPath,
  ["--test", "tests/inquiry.test.mjs"],
  {
    stdio: "inherit",
    env: { ...process.env, YOB_TEST_MODULE: `${output}/inquiry-server.cjs` },
  },
);
process.exit(result.status ?? 1);
