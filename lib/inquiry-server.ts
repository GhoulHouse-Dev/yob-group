import { inquirySchema, attachmentError } from "./inquiry";
import { services } from "./site";
export type DeliveryConfig = {
  enabled: boolean;
  apiKey?: string;
  from?: string;
  to?: string;
};
const MAX_BODY = 3.5 * 1024 * 1024;
const reply = (
  status: number,
  message: string,
  extra: Record<string, unknown> = {},
) =>
  Response.json(
    { ok: false, message, ...extra },
    { status, headers: { "Cache-Control": "no-store" } },
  );
async function readLimited(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) {
        await reader.cancel();
        throw new Error("too-large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const data = new Uint8Array(size);
  let pos = 0;
  for (const chunk of chunks) {
    data.set(chunk, pos);
    pos += chunk.byteLength;
  }
  return new Response(data, {
    headers: { "Content-Type": request.headers.get("content-type") ?? "" },
  }).formData();
}
export async function handleInquiry(
  request: Request,
  config: DeliveryConfig,
  transport: typeof fetch = fetch,
): Promise<Response> {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return reply(403, "Pyyntöä ei voitu lähettää.");
  if (!config.enabled || !config.apiKey || !config.from || !config.to)
    return reply(
      503,
      "Pyyntöä ei lähetetty. Lomake on esikatselussa. Ota yhteyttä puhelimitse tai sähköpostilla.",
    );
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
    return reply(415, "Tarkista lomakkeen lähetysmuoto.");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY)
    return reply(413, "Liitteiden yhteiskokoraja on 3 Mt.");
  let data: FormData;
  try {
    data = await readLimited(request);
  } catch {
    return reply(413, "Pyyntöä ei voitu käsitellä. Tarkista liitteiden koko.");
  }
  const fields = Object.fromEntries(
    [...data.entries()].filter(([key]) => key !== "attachments"),
  );
  const parsed = inquirySchema.safeParse(fields);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const e of parsed.error.issues)
      errors[String(e.path[0])] ??= e.message;
    return reply(422, "Tarkista lomakkeen tiedot.", { errors });
  }
  const files = data
    .getAll("attachments")
    .filter((f): f is File => typeof f !== "string" && f.size > 0);
  const fileError = attachmentError(files);
  if (fileError)
    return reply(422, fileError, { errors: { attachments: fileError } });
  const v = parsed.data;
  const service =
    services.find((s) => s.slug === v.service)?.title ?? "En tiedä vielä";
  const message = [
    `Nimi: ${v.name}`,
    `Puhelin: ${v.phone || "-"}`,
    `Sähköposti: ${v.email || "-"}`,
    `Paikkakunta: ${v.location}`,
    `Yritys/taloyhtiö: ${v.organization || "-"}`,
    `Palvelu: ${service}`,
    `Toivottu ajankohta: ${v.date || "-"}`,
    "",
    v.description,
  ].join("\n");
  const attachments = await Promise.all(
    files.map(async (f) => ({
      filename: f.name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120),
      content: Buffer.from(await f.arrayBuffer()).toString("base64"),
    })),
  );
  const rawKey = request.headers.get("Idempotency-Key") ?? crypto.randomUUID();
  if (!/^[a-zA-Z0-9-]{16,64}$/.test(rawKey))
    return reply(400, "Pyyntöä ei voitu lähettää.");
  try {
    const res = await transport("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `yob-inquiry-${rawKey}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        subject: `Kohdearviopyyntö: ${v.location.replace(/[\r\n]/g, " ")}`,
        text: message,
        ...(v.email ? { reply_to: v.email } : {}),
        ...(attachments.length ? { attachments } : {}),
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok)
      return reply(
        502,
        "Pyyntöä ei voitu lähettää. Tietosi ovat edelleen lomakkeella. Yritä uudelleen tai ota yhteyttä puhelimitse tai sähköpostilla.",
      );
    const result = (await res.json()) as {
      id?: unknown;
    };
    if (typeof result.id !== "string" || !result.id)
      return reply(
        502,
        "Lähetyksen vastaanottoa ei voitu vahvistaa. Ota yhteyttä puhelimitse tai sähköpostilla.",
      );
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return reply(
      502,
      "Lähetys epäonnistui. Tietosi ovat edelleen lomakkeella. Ota yhteyttä puhelimitse tai sähköpostilla.",
    );
  }
}
