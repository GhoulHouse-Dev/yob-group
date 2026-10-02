import { z } from "zod";

export const quoteEstimateSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("estimated"), minPrice: z.number().finite().nonnegative(),
    maxPrice: z.number().finite().nonnegative(), vatIncluded: z.boolean() }).strict(),
  z.object({ status: z.literal("manual_quote"), reason: z.enum([
    "missing_measurement", "unsupported_scope", "pricing_unavailable",
  ]) }).strict(),
]).refine((v) => v.status !== "estimated" || v.maxPrice >= v.minPrice);
export type QuoteEstimateResponse = z.infer<typeof quoteEstimateSchema>;
export const attachmentRefSchema = z.object({ id: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export type AttachmentRef = z.infer<typeof attachmentRefSchema>;
