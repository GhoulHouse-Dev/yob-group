import "server-only";
import { createHash } from "node:crypto";
import { isSameOrigin } from "../request-origin";
import type { DeliveryConfig } from "../inquiry-server";
import { quoteLeadSchema } from "./lead-schema";
import { resolveAttachments } from "./uploads";
import { readEstimateToken } from "./estimate-token";
import { formatQuoteSummary } from "./summary";
import type { QuoteStore } from "./storage";
import { readLimitedBody } from "./body";
import { cookieHeader, receiptCookie, signToken } from "./session";

export type QuoteLeadConfig = DeliveryConfig & { store?: QuoteStore; secret?: string };
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
export async function handleQuoteLead(request: Request, config: QuoteLeadConfig, transport: typeof fetch = fetch) {
  const reply = (status: number, message: string, errors?: Record<string, string>) => Response.json({ ok: false, message, ...(errors ? { errors } : {}) }, {
    status, headers: { "Cache-Control": "no-store" },
  });
  if (!isSameOrigin(request)) return reply(403, "Pyyntöä ei voitu lähettää.");
  if (!config.enabled || !config.apiKey || !config.from || !config.to || !config.store || !config.secret)
    return reply(503, "Tarjouspyyntöä ei lähetetty. Lomake on esikatselussa.");
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply(415, "Tarkista lähetysmuoto.");
  const rawKey = request.headers.get("Idempotency-Key");
  if (!rawKey || !/^[a-zA-Z0-9-]{16,64}$/.test(rawKey)) return reply(400, "Pyyntöä ei voitu lähettää.");
  let raw: unknown;
  try { raw = JSON.parse(new TextDecoder().decode(await readLimitedBody(request, 24 * 1024))); }
  catch { return reply(413, "Pyyntöä ei voitu käsitellä. Tarkista tiedot."); }
  const result = quoteLeadSchema.safeParse(raw);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) errors[issue.path[0] === "contact" ? String(issue.path[1]) : String(issue.path[0])] ??= issue.message;
    return reply(422, "Tarkista tarjouspyynnön tiedot.", errors);
  }
  const value = result.data;
  let estimate;
  try { estimate = readEstimateToken(value.estimateToken, value.quote, config.secret); }
  catch { return reply(422, "Arvio on vanhentunut tai lähtötiedot ovat muuttuneet. Palaa edelliseen vaiheeseen."); }
  const id = hash(rawKey); const key = `quote-leads/${id}.json`;
  const signature = hash(JSON.stringify(value));
  const success = () => Response.json({ ok: true, inquiryId: id }, { headers: {
    "Cache-Control": "no-store", "Set-Cookie": cookieHeader(receiptCookie, signToken(id, config.secret!, 600, "receipt"), request, 600),
  } });
  try {
    const existing = await config.store.get(key) as { signature: string; delivered?: boolean } | null;
    if (existing && existing.signature !== signature) return reply(409, "Tiedot ovat muuttuneet. Yritä lähettämistä uudelleen.");
    if (existing?.delivered) return success();
    let attachments;
    try { attachments = await resolveAttachments(request, value.attachments, config.secret, config.store); }
    catch { return reply(422, "Liitteet ovat vanhentuneet tai niitä ei voitu vahvistaa. Lisää liitteet uudelleen.", { attachments: "Lisää liitteet uudelleen kuvavaiheessa." }); }
    // Persist the complete validated lead, including durable copies of files,
    // before delivery. A failed provider call retains the record for retry.
    const record = { ...value, estimate, attachments, signature, createdAt: new Date().toISOString(), delivered: false };
    if (!existing && !await config.store.put(key, record, true)) {
      const raced = await config.store.get(key) as { signature: string; delivered?: boolean } | null;
      if (!raced || raced.signature !== signature) return reply(409, "Pyyntö on jo käsittelyssä. Tarkista tiedot.");
      if (raced.delivered) return success();
    }
    const c = value.contact;
    const price = estimate.status === "estimated"
      ? `Palvelimen hinta-arvio: ${estimate.minPrice}–${estimate.maxPrice} EUR, ALV ${estimate.vatIncluded ? "sisältyy" : "ei sisälly"}`
      : `Kohdekohtainen tarjous (${estimate.reason}).`;
    const res = await transport("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `yob-quote-${id}` },
      body: JSON.stringify({ from: config.from, to: [config.to], subject: `Tarjouspyyntö: ${c.location.replace(/[\r\n]/g, " ")}`,
        text: [`Tarjouspyynnön tunniste: ${id}`, `Nimi: ${c.name}`, `Sähköposti: ${c.email || "-"}`, `Puhelin: ${c.phone || "-"}`,
          `Paikkakunta: ${c.location}`, `Yritys/taloyhtiö: ${c.organization || "-"}`, `Yhteydenotto: ${c.preferredContact ?? "ei valittu"}`,
          `Ajankohta: ${c.date || "-"}`, "", c.description, "", formatQuoteSummary(value.quote), price].join("\n"),
        ...(c.email ? { reply_to: c.email } : {}),
        ...(attachments.length ? { attachments: attachments.map((f) => ({ filename: f.filename, content: f.content })) } : {}),
      }), signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return reply(502, "Tarjouspyyntö tallennettiin, mutta viestinvälitys epäonnistui. Yritä uudelleen samalla lomakkeella.");
    const acknowledgement = await res.json() as { id?: unknown };
    if (typeof acknowledgement.id !== "string" || !acknowledgement.id) return reply(502, "Viestinvälitystä ei voitu vahvistaa. Yritä uudelleen.");
    await config.store.put(key, { ...record, delivered: true, providerId: acknowledgement.id });
    return success();
  } catch { return reply(502, "Tarjouspyynnön käsittely epäonnistui. Tietosi ovat edelleen lomakkeella. Yritä uudelleen."); }
}
