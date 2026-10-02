import { handleInquiry } from "@/lib/inquiry-server";
export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(request: Request) {
  const config = process.env;
  return handleInquiry(request, {
    enabled: config.LEAD_INTAKE_ENABLED === "true",
    apiKey: config.RESEND_API_KEY,
    from: config.LEAD_FROM,
    to: config.LEAD_RECIPIENT,
  });
}
