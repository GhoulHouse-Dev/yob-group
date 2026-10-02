import { z } from "zod";
import { quoteQuestions } from "./questions";

const measurement = (integer = false) => z.preprocess((value) => {
  if (value === "unknown" || value === null) return null;
  if (typeof value !== "string") return value;
  const normalized = value.trim().replace(",", ".");
  return /^\d+(?:\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}, z.number().finite("Tarkista mitta.").positive("Anna positiivinen mitta tai valitse En tiedä.")
  .max(1_000_000, "Mitta ylittää lomakkeen teknisen rajan. Kerro laajuus kuvauksessa.")
  .refine((v) => !integer || Number.isInteger(v), "Anna kokonaisluku.").nullable());

function detailSchema(service: string) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of quoteQuestions[service]) {
    shape[field.key] = field.kind === "number" ? measurement(field.integer)
      : field.kind === "select" ? z.string().refine((v) => field.options?.includes(v), "Valitse vaihtoehto.")
      : z.string().trim().max(1000, "Teksti on liian pitkä.");
  }
  if (service === "timanttityot") {
    const common = { work: shape.work, material: shape.material, thickness: shape.thickness };
    return z.discriminatedUnion("work", [
      z.object({ ...common, work: z.literal("Timanttiporaus"), count: shape.count, diameter: shape.diameter }).strict(),
      z.object({ ...common, work: z.literal("Timanttisahaus"), length: shape.length }).strict(),
      z.object({ ...common, work: z.literal("En tiedä") }).strict(),
    ]);
  }
  return z.object(shape).strict();
}
const common = {
  propertyType: z.enum(["Taloyhtiö", "Omakotitalo", "Liike- tai toimitila", "Työmaa", "Muu kohde", "En tiedä"]),
  customerType: z.enum(["Yksityinen", "Taloyhtiö", "Yritys"]),
};
const branch = <T extends string>(service: T) => z.object({ ...common, service: z.literal(service), details: detailSchema(service) }).strict();
export const quoteSchema = z.discriminatedUnion("service", [
  branch("injektointi"), branch("vedeneristys"), branch("timanttityot"),
  branch("rakennekorjaukset"), branch("vaestonsuojat"), branch("betonirakentaminen"),
  branch("saneeraukset"), branch("unknown"),
]);
export type QuoteDetails = z.infer<typeof quoteSchema>;
export function initialDetails(service: string): Record<string, string> {
  return Object.fromEntries((quoteQuestions[service] ?? []).map((f) => [f.key,
    f.kind === "number" ? "unknown" : f.kind === "select" ? "En tiedä" : "",
  ]));
}
export function activeDetails(service: string, details: Record<string, string>) {
  if (service !== "timanttityot") return details;
  const { work, material, thickness, count, diameter, length } = details;
  const base = { work, material, thickness };
  return work === "Timanttiporaus" ? { ...base, count, diameter }
    : work === "Timanttisahaus" ? { ...base, length } : { ...base, work: "En tiedä" };
}
export function validRequestedDate(value: string) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
