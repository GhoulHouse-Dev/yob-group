import { z } from "zod";
export const quoteEvents = ["quote_started", "quote_step_completed", "quote_estimate_generated",
  "quote_manual_required", "quote_contact_started", "quote_submitted"] as const;
export const quoteEventSchema = z.object({
  event: z.enum(quoteEvents), step: z.number().int().min(1).max(5),
  service: z.enum(["injektointi", "vedeneristys", "timanttityot", "rakennekorjaukset", "vaestonsuojat", "betonirakentaminen", "saneeraukset", "unknown"]),
  preview: z.boolean(),
}).strict();
export type QuoteEvent = z.infer<typeof quoteEventSchema>;
export function trackQuoteEvent(event: QuoteEvent, enabled: boolean) {
  // Hook for local QA or a separately approved analytics integration. Never
  // include answers, prices, filenames, contact details or user identifiers.
  window.dispatchEvent(new CustomEvent("yob:quote", { detail: event }));
  if (enabled) void fetch("/api/quote-events", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event), credentials: "omit", keepalive: true }).catch(() => {});
}
