import { randomUUID } from "node:crypto";
import { isSameOrigin } from "@/lib/request-origin";
import { readLimitedBody } from "@/lib/quote/body";
import { quoteEventSchema } from "@/lib/quote/analytics";
import { storageConfigured, createQuoteStore } from "@/lib/quote/storage";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const reply = (status: number) => new Response(null, { status, headers: { "Cache-Control": "no-store" } });
  if (!isSameOrigin(request)) return reply(403);
  if (process.env.QUOTE_ANALYTICS_ENABLED !== "true" || !storageConfigured()) return reply(503);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply(415);
  let event;
  try { event = quoteEventSchema.safeParse(JSON.parse(new TextDecoder().decode(await readLimitedBody(request, 1024)))); }
  catch { return reply(413); }
  if (!event.success) return reply(422);
  // Preview activity is excluded from production funnel counts.
  if (event.data.preview) return reply(204);
  try {
    await createQuoteStore().put(`quote-events/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.json`, {
      ...event.data, recordedAt: new Date().toISOString(),
    });
    return reply(204);
  } catch { return reply(502); }
}
