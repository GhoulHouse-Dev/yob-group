import { z } from "zod";
import { inquiryFields, inquirySchema } from "../inquiry";
import { quoteSchema } from "./schema";
import { attachmentRefSchema } from "./types";
export const quoteLeadSchema = z.object({
  contact: inquiryFields.omit({ quoteDetails: true }).strict().superRefine((v, ctx) => {
    const result = inquirySchema.safeParse(v);
    if (!result.success) for (const issue of result.error.issues) ctx.addIssue(issue);
  }),
  quote: quoteSchema,
  estimateToken: z.string().max(2048),
  attachments: z.array(attachmentRefSchema).max(3),
}).strict().superRefine((v, ctx) => {
  if (v.contact.service !== v.quote.service) ctx.addIssue({ code: "custom", path: ["quote"], message: "Tarkista palveluvalinta." });
});
