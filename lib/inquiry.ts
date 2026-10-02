import { z } from "zod";
import { services } from "./site";
const text = (max: number) =>
  z.string().trim().max(max, "Teksti on liian pitkä.");
export const inquirySchema = z
  .object({
    name: text(100).min(1, "Kirjoita nimesi."),
    phone: text(40).refine(
      (v) => !v || /^[+\d\s().-]{5,40}$/.test(v),
      "Tarkista puhelinnumero.",
    ),
    email: text(254).refine(
      (v) => !v || z.string().email().safeParse(v).success,
      "Tarkista sähköpostiosoitteen kirjoitusasu.",
    ),
    location: text(100).min(1, "Kirjoita kohteen paikkakunta."),
    description: text(5000).min(1, "Kuvaa lyhyesti kohde ja korjaustarve."),
    organization: text(150),
    service: text(50).refine(
      (v) => v === "unknown" || services.some((s) => s.slug === v),
      "Valitse palvelu tai En tiedä vielä.",
    ),
    date: text(10).refine(
      (v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v),
      "Tarkista ajankohta.",
    ),
    website: text(100).refine((v) => v === "", "Pyyntöä ei voitu lähettää."),
  })
  .superRefine((v, ctx) => {
    if (!v.phone && !v.email)
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Anna puhelinnumero tai sähköpostiosoite.",
      });
  });
export type Inquiry = z.infer<typeof inquirySchema>;
export const acceptedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
export const maxFileSize = 3 * 1024 * 1024;
export const maxTotalSize = 3 * 1024 * 1024;
export function attachmentError(
  files: {
    size: number;
    type: string;
  }[],
) {
  if (files.length > 3) return "Lisää enintään kolme liitettä.";
  if (files.some((f) => f.size > maxFileSize))
    return "Yksittäisen liitteen kokoraja on 3 Mt.";
  if (files.some((f) => !acceptedTypes.includes(f.type)))
    return "Sallitut tiedostotyypit ovat JPG, PNG, WebP ja PDF.";
  if (files.reduce((a, f) => a + f.size, 0) > maxTotalSize)
    return "Liitteiden yhteiskokoraja on 3 Mt.";
  return null;
}
