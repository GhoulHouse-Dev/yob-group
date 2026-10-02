import "server-only";
import type { QuoteDetails } from "./schema";
import type { QuoteEstimateResponse } from "./types";

// Source of truth stays on the server. No YOB tariff has been approved.
// Add rules only with approved scope limits, tax treatment and rate version.
export function estimateQuote(quote: QuoteDetails): QuoteEstimateResponse {
  if (quote.service === "unknown") return { status: "manual_quote", reason: "unsupported_scope" };
  return { status: "manual_quote", reason: "pricing_unavailable" };
}
