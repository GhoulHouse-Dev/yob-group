import { handleInquiry } from "@/lib/inquiry-server";
import { handleQuoteLead } from "@/lib/quote/lead-server";
import { createQuoteStore, storageConfigured } from "@/lib/quote/storage";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const config = process.env;
  if (request.headers.get("content-type")?.startsWith("application/json")) {
    return handleQuoteLead(request, {
      enabled: config.LEAD_INTAKE_ENABLED === "true", apiKey: config.RESEND_API_KEY,
      from: config.LEAD_FROM, to: config.LEAD_RECIPIENT, secret: config.QUOTE_SESSION_SECRET,
      ...(storageConfigured(config) ? { store: createQuoteStore(config) } : {}),
    });
  }
  return handleInquiry(request, {
    enabled: config.LEAD_INTAKE_ENABLED === "true",
    apiKey: config.RESEND_API_KEY,
    from: config.LEAD_FROM,
    to: config.LEAD_RECIPIENT,
  });
}
