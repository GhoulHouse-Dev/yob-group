import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { attachmentError, maxTotalSize } from "../inquiry";
import { isSameOrigin } from "../request-origin";
import { currentSession, newSession, cookieHeader, sessionCookie, signToken } from "./session";
import type { QuoteStore } from "./storage";
import type { AttachmentRef } from "./types";
import { readLimitedBody } from "./body";

export const storedAttachmentSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{64}$/), filename: z.string().max(120),
  type: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  size: z.number().int().positive().max(maxTotalSize), content: z.string().max(4 * 1024 * 1024),
  expires: z.number().int(),
}).strict();
export type StoredAttachment = z.infer<typeof storedAttachmentSchema>;
function matchesMagic(file: File, bytes: Buffer) {
  if (file.type === "image/jpeg") return bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (file.type === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (file.type === "image/webp") return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  return file.type === "application/pdf" && bytes.toString("ascii", 0, 5) === "%PDF-";
}
export async function handleQuoteUpload(request: Request, config: { enabled: boolean; secret?: string; store?: QuoteStore }) {
  const reply = (status: number, message: string) => Response.json({ ok: false, message }, { status, headers: { "Cache-Control": "no-store" } });
  if (!isSameOrigin(request)) return reply(403, "Pyyntöä ei voitu käsitellä.");
  if (!config.enabled || !config.store || !config.secret) return reply(503, "Liitteitä ei tallenneta esikatselussa.");
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) return reply(415, "Tarkista lähetysmuoto.");
  let files: File[];
  try {
    const bytes = await readLimitedBody(request, 3.5 * 1024 * 1024);
    const data = await new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
    if ([...data.keys()].some((k) => k !== "files")) return reply(422, "Tarkista liitteet.");
    files = data.getAll("files").filter((v): v is File => typeof v !== "string" && v.size > 0);
  } catch { return reply(413, "Liitteiden yhteiskokoraja on 3 Mt."); }
  const error = attachmentError(files);
  if (error || !files.length) return reply(422, error ?? "Valitse vähintään yksi liite.");
  const session = currentSession(request, config.secret) ?? newSession();
  try {
    const entries: StoredAttachment[] = [];
    for (const file of files) {
      const bytes = Buffer.from(await file.arrayBuffer());
      if (!matchesMagic(file, bytes)) return reply(422, "Tiedoston sisältö ei vastaa ilmoitettua tiedostotyyppiä.");
      const filename = file.name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120);
      const id = createHash("sha256").update(file.type).update(filename).update(bytes).digest("hex");
      entries.push({ id, filename, type: file.type as StoredAttachment["type"], size: file.size,
        content: bytes.toString("base64"), expires: Date.now() + 7200 * 1000 });
    }
    for (const entry of entries) await config.store.put(`quote-uploads/${session}/${entry.id}.json`, entry);
    return Response.json({ ok: true, attachments: entries.map(({ id }) => ({ id })) }, {
      headers: { "Cache-Control": "no-store", "Set-Cookie": cookieHeader(sessionCookie, signToken(session, config.secret), request) },
    });
  } catch { return reply(502, "Liitteiden tallennus epäonnistui. Yritä uudelleen."); }
}
export async function resolveAttachments(request: Request, refs: AttachmentRef[], secret: string, store: QuoteStore) {
  if (!refs.length) return [];
  const session = currentSession(request, secret);
  if (!session || new Set(refs.map((v) => v.id)).size !== refs.length) throw new Error("Invalid attachment session");
  const files: StoredAttachment[] = [];
  for (const ref of refs) {
    const entry = storedAttachmentSchema.parse(await store.get(`quote-uploads/${session}/${ref.id}.json`));
    if (entry.id !== ref.id || entry.expires <= Date.now() || Buffer.from(entry.content, "base64").length !== entry.size)
      throw new Error("Expired or invalid attachment");
    files.push(entry);
  }
  if (attachmentError(files)) throw new Error("Attachment size exceeded");
  return files;
}
