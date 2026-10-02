import "server-only";
import { createHash, createHmac } from "node:crypto";

export interface QuoteStore {
  get(key: string): Promise<unknown | null>;
  put(key: string, value: unknown, createOnly?: boolean): Promise<boolean>;
}
export function storageConfigured(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.QUOTE_S3_ENDPOINT && env.QUOTE_S3_REGION && env.QUOTE_S3_BUCKET &&
    env.QUOTE_S3_ACCESS_KEY_ID && env.QUOTE_S3_SECRET_ACCESS_KEY && env.QUOTE_SESSION_SECRET && env.QUOTE_SESSION_SECRET.length >= 32);
}
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const hmac = (key: string | Buffer, value: string) => createHmac("sha256", key).update(value).digest();

// Private S3-compatible storage using AWS SigV4. No public or signed object URL
// is exposed to the browser. The endpoint and credentials are operator settings.
export function createQuoteStore(env: NodeJS.ProcessEnv = process.env, transport: typeof fetch = fetch): QuoteStore {
  if (!storageConfigured(env)) throw new Error("Quote storage is not configured");
  const endpoint = new URL(env.QUOTE_S3_ENDPOINT!);
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== "/")
    throw new Error("Use an HTTPS S3 endpoint without path or credentials");
  const bucket = env.QUOTE_S3_BUCKET!;
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error("Invalid bucket");
  async function call(method: "GET" | "PUT", key: string, value?: unknown, createOnly = false) {
    if (!/^[a-zA-Z0-9/_-]+\.json$/.test(key)) throw new Error("Invalid object key");
    const url = new URL(`/${bucket}/${key}`, endpoint);
    const body = method === "PUT" ? JSON.stringify(value) : "";
    const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    const day = date.slice(0, 8);
    const headers: Record<string, string> = {
      host: url.host, "x-amz-content-sha256": sha(body), "x-amz-date": date,
      ...(method === "PUT" ? { "content-type": "application/json" } : {}),
      ...(createOnly ? { "if-none-match": "*" } : {}),
      ...(env.QUOTE_S3_SESSION_TOKEN ? { "x-amz-security-token": env.QUOTE_S3_SESSION_TOKEN } : {}),
    };
    const keys = Object.keys(headers).sort();
    const canonicalHeaders = keys.map((k) => `${k}:${headers[k]}\n`).join("");
    const signedHeaders = keys.join(";");
    const scope = `${day}/${env.QUOTE_S3_REGION}/s3/aws4_request`;
    const canonical = [method, url.pathname, "", canonicalHeaders, signedHeaders, sha(body)].join("\n");
    const signingKey = hmac(hmac(hmac(hmac(`AWS4${env.QUOTE_S3_SECRET_ACCESS_KEY}`, day), env.QUOTE_S3_REGION!), "s3"), "aws4_request");
    const signature = createHmac("sha256", signingKey).update(`AWS4-HMAC-SHA256\n${date}\n${scope}\n${sha(canonical)}`).digest("hex");
    headers.authorization = `AWS4-HMAC-SHA256 Credential=${env.QUOTE_S3_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    return transport(url, { method, headers, ...(method === "PUT" ? { body } : {}),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000) });
  }
  return {
    async get(key) {
      const res = await call("GET", key);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Storage read failed");
      return res.json();
    },
    async put(key, value, createOnly = false) {
      const res = await call("PUT", key, value, createOnly);
      if (createOnly && res.status === 412) return false;
      if (!res.ok) throw new Error("Storage write failed");
      return true;
    },
  };
}
