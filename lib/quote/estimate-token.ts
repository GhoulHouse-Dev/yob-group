import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { quoteEstimateSchema, type QuoteEstimateResponse } from "./types";
import type { QuoteDetails } from "./schema";
const quoteHash = (quote: QuoteDetails) => createHash("sha256").update(JSON.stringify(quote)).digest("hex");
const signature = (content: string, secret: string) => createHmac("sha256", secret).update(`estimate:${content}`).digest();
export function issueEstimateToken(quote: QuoteDetails, estimate: QuoteEstimateResponse, secret: string) {
  const content = Buffer.from(JSON.stringify({ quoteHash: quoteHash(quote), estimate, expires: Date.now() + 7200 * 1000 })).toString("base64url");
  return `${content}.${signature(content, secret).toString("hex")}`;
}
export function readEstimateToken(token: string, quote: QuoteDetails, secret: string): QuoteEstimateResponse {
  const [content, mac, extra] = token.split(".");
  if (extra || !/^[a-zA-Z0-9_-]+$/.test(content ?? "") || !/^[a-f0-9]{64}$/.test(mac ?? "") || !timingSafeEqual(signature(content, secret), Buffer.from(mac, "hex")))
    throw new Error("Invalid estimate token");
  const data = JSON.parse(Buffer.from(content, "base64url").toString("utf8"));
  if (data.expires <= Date.now() || typeof data.expires !== "number" || data.quoteHash !== quoteHash(quote)) throw new Error("Estimate no longer matches");
  return quoteEstimateSchema.parse(data.estimate);
}
