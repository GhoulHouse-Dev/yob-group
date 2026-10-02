export type QuoteField = {
  key: string;
  label: string;
  unit?: string;
  kind: "text" | "number" | "select";
  options?: readonly string[];
  integer?: boolean;
};
export const quoteQuestions: Record<string, QuoteField[]> = {
  injektointi: [
    { key: "observation", label: "Mitä olet havainnut?", kind: "select", options: ["Halkeama", "Vesivuoto", "Halkeama ja vuoto", "Muu havainto", "En tiedä"] },
    { key: "position", label: "Missä kohdassa rakennetta?", kind: "text" },
    { key: "length", label: "Halkeaman arvioitu pituus", unit: "m", kind: "number" },
    { key: "leak", label: "Milloin vuoto näkyy?", kind: "select", options: ["Jatkuvasti", "Sateella tai ajoittain", "Vuotoa ei näy", "En tiedä"] },
  ],
  vedeneristys: [
    { key: "surface", label: "Vedeneristettävä kohde", kind: "select", options: ["Sokkeli", "Maanvastainen rakenne", "Kermikatto", "Muu kohde", "En tiedä"] },
    { key: "area", label: "Arvioitu pinta-ala", unit: "m²", kind: "number" },
    { key: "material", label: "Alustan materiaali", kind: "select", options: ["Betoni", "Muuraus", "Kermi", "Muu materiaali", "En tiedä"] },
    { key: "condition", label: "Mitä alustan kunnosta tiedetään?", kind: "text" },
  ],
  timanttityot: [
    { key: "work", label: "Tarvittava työ", kind: "select", options: ["Timanttiporaus", "Timanttisahaus", "En tiedä"] },
    { key: "material", label: "Työstettävä materiaali", kind: "select", options: ["Betoni", "Tiili", "Muu materiaali", "En tiedä"] },
    { key: "thickness", label: "Rakenteen paksuus", unit: "mm", kind: "number" },
    { key: "count", label: "Reikien määrä", unit: "kpl", kind: "number", integer: true },
    { key: "diameter", label: "Reiän halkaisija", unit: "mm", kind: "number" },
    { key: "length", label: "Sahauspituus", unit: "m", kind: "number" },
  ],
  rakennekorjaukset: [
    { key: "structure", label: "Korjattava tai vahvistettava rakenne", kind: "text" },
    { key: "plans", label: "Onko suunnitelmia saatavilla?", kind: "select", options: ["Kyllä", "Ei", "En tiedä"] },
  ],
  vaestonsuojat: [
    { key: "work", label: "Tarvittava työ", kind: "select", options: ["Tarkastus", "Tiiveyskoe", "Korjaus", "Käyttöönottoon liittyvä työ", "En tiedä"] },
    { key: "count", label: "Väestönsuojien määrä", unit: "kpl", kind: "number", integer: true },
    { key: "reports", label: "Onko aiempia tarkastusraportteja?", kind: "select", options: ["Kyllä", "Ei", "En tiedä"] },
  ],
  betonirakentaminen: [{ key: "scope", label: "Rakennettava rakenne ja työn laajuus", kind: "text" }],
  saneeraukset: [
    { key: "current", label: "Tilan nykyinen käyttö", kind: "text" },
    { key: "change", label: "Suunniteltu muutos", kind: "text" },
  ],
  unknown: [{ key: "position", label: "Missä ongelma näkyy?", kind: "text" }],
};
export function visibleQuestions(service: string, details: Record<string, unknown>) {
  return (quoteQuestions[service] ?? []).filter((field) => {
    if (service !== "timanttityot") return true;
    if (["count", "diameter"].includes(field.key)) return details.work === "Timanttiporaus";
    if (field.key === "length") return details.work === "Timanttisahaus";
    return true;
  });
}
