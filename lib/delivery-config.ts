import { env } from "cloudflare:workers";
export function deliveryAvailable() {
  const e = env as unknown as Record<string, string | undefined>;
  return (
    e.LEAD_INTAKE_ENABLED === "true" &&
    Boolean(e.RESEND_API_KEY && e.LEAD_FROM && e.LEAD_RECIPIENT)
  );
}
