import { quoteDeliveryAvailable } from "@/lib/delivery-config";
import { createQuoteStore } from "@/lib/quote/storage";
import { handleQuoteUpload } from "@/lib/quote/uploads";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: Request) {
  const enabled = quoteDeliveryAvailable();
  return handleQuoteUpload(request, { enabled, secret: process.env.QUOTE_SESSION_SECRET,
    ...(enabled ? { store: createQuoteStore() } : {}) });
}
