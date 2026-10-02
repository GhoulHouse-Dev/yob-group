declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    LEAD_INTAKE_ENABLED?: string;
    RESEND_API_KEY?: string;
    LEAD_FROM?: string;
    LEAD_RECIPIENT?: string;
  }
}
