import type { QuoteDetails } from "./schema";
// No YOB tariff has been approved. Do not substitute sample or industry prices.
export function estimateQuote(quote: QuoteDetails) {
  return { kind: "quote_only" as const, reason: "no_tariff" as const, service: quote.service };
}
