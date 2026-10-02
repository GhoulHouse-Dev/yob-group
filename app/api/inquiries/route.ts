import { env } from "cloudflare:workers";
import { handleInquiry } from "@/lib/inquiry-server";
export async function POST(request: Request) {
  const config = env as unknown as Record<string, string | undefined>;
  return handleInquiry(request, {
    enabled: config.LEAD_INTAKE_ENABLED === "true",
    apiKey: config.RESEND_API_KEY,
    from: config.LEAD_FROM,
    to: config.LEAD_RECIPIENT,
  });
}
