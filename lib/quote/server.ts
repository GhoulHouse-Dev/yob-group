import { quoteSchema } from "./schema";
import { estimateQuote } from "./pricing";
import { isSameOrigin } from "../request-origin";
import { issueEstimateToken } from "./estimate-token";
export async function handleQuoteEstimate(request: Request, secret = process.env.QUOTE_SESSION_SECRET) {
  const respond = (body: unknown, status = 200) => Response.json(body, {
    status, headers: { "Cache-Control": "no-store" },
  });
  if (!isSameOrigin(request))
    return respond({ ok: false, message: "Pyyntöä ei voitu käsitellä." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return respond({ ok: false, message: "Tarkista lähetysmuoto." }, 415);
  const reader = request.body?.getReader();
  if (!reader) return respond({ ok: false, message: "Lähtötiedot puuttuvat." }, 422);
  let text = ""; let bytes = 0; const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 16 * 1024) {
        await reader.cancel(); return respond({ ok: false, message: "Pyyntö on liian suuri." }, 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const result = quoteSchema.safeParse(JSON.parse(text));
    if (!result.success) return respond({ ok: false, message: "Tarkista kohteen tiedot." }, 422);
    const estimate = estimateQuote(result.data);
    return respond({ ok: true, estimate, ...(secret ? { estimateToken: issueEstimateToken(result.data, estimate, secret) } : {}) });
  } catch {
    return respond({ ok: false, message: "Tarkista kohteen tiedot." }, 422);
  } finally { reader.releaseLock(); }
}
