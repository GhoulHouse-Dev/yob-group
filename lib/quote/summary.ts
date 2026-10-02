import type { QuoteDetails } from "./schema";
import { visibleQuestions } from "./questions";
import { services } from "../site";
export function formatQuoteSummary(quote: QuoteDetails): string {
  const details = quote.details as Record<string, unknown>;
  return [
    `Työ: ${services.find((s) => s.slug === quote.service)?.title ?? "En tiedä menetelmää"}`,
    `Kohde: ${quote.propertyType}`,
    `Asiakas: ${quote.customerType}`,
    ...visibleQuestions(quote.service, details).map((f) => {
      const v = details[f.key];
      const text = v === null ? "En tiedä" : v === "" ? "Ei ilmoitettu"
        : typeof v === "number" ? `${v.toLocaleString("fi-FI")}${f.unit ? ` ${f.unit}` : ""}` : String(v);
      return `${f.label}: ${text}`;
    }),
  ].join("\n");
}
