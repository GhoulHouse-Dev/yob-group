"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight, Check, Paperclip } from "lucide-react";
import { services } from "@/lib/site";
import { inquirySchema, attachmentError } from "@/lib/inquiry";
import { activeDetails, initialDetails, quoteSchema, validRequestedDate } from "@/lib/quote/schema";
import { visibleQuestions } from "@/lib/quote/questions";
import { formatQuoteSummary } from "@/lib/quote/summary";

type Values = {
  service: string; location: string; propertyType: string; customerType: string;
  description: string; date: string; name: string; phone: string; email: string;
  organization: string; website: string; preferredContact: "email" | "phone";
  details: Record<string, string>;
};
const steps = ["Työ", "Kohde", "Laajuus", "Kuvat ja aikataulu", "Yhteenveto"];
const titles = ["Millaista työtä tarvitset?", "Kerro kohteesta.", "Täsmennä työn laajuutta.", "Kuvaa lähtötilanne.", "Tarkista ja jätä yhteystiedot."];
export function QuoteCalculator({ enabled = false, instance = "home" }: { enabled?: boolean; instance?: string }) {
  const { register, control, setValue, getValues } = useForm<Values>({ defaultValues: {
    service: "", location: "", propertyType: "En tiedä", customerType: "Yksityinen",
    description: "", date: "", name: "", phone: "", email: "", organization: "",
    website: "", preferredContact: "email", details: {},
  }});
  const values = useWatch({ control }) as Values;
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const [message, setMessage] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<{ signature: string; key: string } | null>(null);
  const id = (key: string) => `quote-${instance}-${key.replaceAll(".", "-")}`;
  const Heading = instance === "page" ? "h2" : "h3";
  const quoteInput = (v: Values) => ({ service: v.service, propertyType: v.propertyType,
    customerType: v.customerType, details: activeDetails(v.service, v.details) });
  const parsed = quoteSchema.safeParse(quoteInput(values));
  const summary = parsed.success ? formatQuoteSummary(parsed.data) : "";
  function move(next: number) {
    setStep(next); setErrors({}); setMessage("");
    requestAnimationFrame(() => headingRef.current?.focus());
  }
  function report(next: Record<string, string>) {
    setErrors(next); setMessage("");
    requestAnimationFrame(() => errorRef.current?.focus());
  }
  function validateStep(): boolean {
    const v = getValues(); const next: Record<string, string> = {};
    if (step === 0 && !services.some((s) => s.slug === v.service) && v.service !== "unknown")
      next.service = "Valitse työ tai En tiedä menetelmää.";
    if (step === 1 && (!v.location.trim() || v.location.length > 100))
      next.location = "Kirjoita kohteen paikkakunta (enintään 100 merkkiä).";
    if (step === 2) {
      const result = quoteSchema.safeParse(quoteInput(v));
      if (!result.success) for (const issue of result.error.issues)
        next[issue.path.join(".")] ??= issue.message;
    }
    if (step === 3) {
      if (!v.description.trim() || v.description.length > 5000) next.description = "Kuvaa kohde ja korjaustarve (enintään 5000 merkkiä).";
      if (!validRequestedDate(v.date)) next.date = "Tarkista ajankohta.";
      const error = attachmentError(files); if (error) next.attachments = error;
    }
    if (Object.keys(next).length) { report(next); return false; }
    return true;
  }
  function next() { if (validateStep()) move(step + 1); }
  function selectService(service: string) {
    setValue("service", service); setValue("details", initialDetails(service)); setErrors({});
  }
  function field(name: "location" | "description" | "date" | "name" | "phone" | "email" | "organization", label: string,
    type = "text", help?: string, full = false) {
    const props = { id: id(name), ...register(name), "aria-invalid": Boolean(errors[name]),
      "aria-describedby": `${help ? id(name) + "-help " : ""}${errors[name] ? id(name) + "-error" : ""}`.trim() || undefined };
    const autoComplete: Record<string, string> = { name: "name", phone: "tel", email: "email", organization: "organization", location: "address-level2" };
    return <div className={`field ${full ? "full" : ""}`} key={name}>
      <label htmlFor={id(name)}>{label}</label>
      {name === "description" ? <textarea {...props} maxLength={5000} />
        : <input {...props} type={type} autoComplete={autoComplete[name]} maxLength={name === "email" ? 254 : name === "phone" ? 40 : name === "organization" ? 150 : 100} />}
      {help && <small id={id(name) + "-help"}>{help}</small>}
      {errors[name] && <small className="field-error" id={id(name) + "-error"}>{errors[name]}</small>}
    </div>;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    if (step < 4) { next(); return; }
    const v = getValues(); const nextErrors: Record<string, string> = {};
    const result = quoteSchema.safeParse(quoteInput(v));
    if (!result.success) { report({ quote: "Tarkista kohteen tiedot palaamalla aiempiin vaiheisiin." }); return; }
    const inquiry = inquirySchema.safeParse(v);
    if (!inquiry.success) for (const issue of inquiry.error.issues)
      nextErrors[String(issue.path[0])] ??= issue.message;
    const fileError = attachmentError(files); if (fileError) nextErrors.attachments = fileError;
    if (Object.keys(nextErrors).length) { report(nextErrors); return; }
    setErrors({});
    if (!enabled) {
      setMessage("Tarjouspyyntö tarkistettu. Tämä on esikatselu: tietojasi ei ole lähetetty YOB:lle. Ota yhteyttä puhelimitse tai sähköpostilla.");
      requestAnimationFrame(() => errorRef.current?.focus()); return;
    }
    const data = new FormData();
    for (const key of ["name", "phone", "email", "location", "description", "organization", "service", "date", "website", "preferredContact"] as const)
      data.set(key, v[key]);
    data.set("quoteDetails", JSON.stringify(result.data));
    files.forEach((f) => data.append("attachments", f));
    const signature = JSON.stringify([...data.entries()].map(([key, value]) => [key,
      typeof value === "string" ? value : [value.name, value.size, value.lastModified],
    ]));
    if (requestRef.current?.signature !== signature) requestRef.current = { signature, key: crypto.randomUUID() };
    setStatus("sending"); setMessage("");
    try {
      const response = await fetch("/api/inquiries", { method: "POST", body: data,
        headers: { "Idempotency-Key": requestRef.current!.key } });
      const body = await response.json() as { ok?: boolean; message?: string; errors?: Record<string, string> };
      if (!response.ok || !body.ok) {
        setStatus("idle"); setErrors(body.errors ?? {});
        setMessage(body.message ?? "Lähetys epäonnistui. Tietosi ovat edelleen lomakkeella.");
        requestAnimationFrame(() => errorRef.current?.focus()); return;
      }
      setStatus("success"); requestAnimationFrame(() => headingRef.current?.focus());
    } catch {
      setStatus("idle"); setMessage("Lähetys epäonnistui. Tietosi ovat edelleen lomakkeella. Yritä uudelleen tai ota yhteyttä puhelimitse tai sähköpostilla.");
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }
  if (status === "success") return <div className="quote-complete" role="status">
    <Check aria-hidden="true" /><h3 ref={headingRef} tabIndex={-1}>Tarjouspyyntösi on vastaanotettu.</h3>
    <p>Kiitos yhteydenotosta. YOB Group ottaa sinuun yhteyttä antamiesi tietojen perusteella.</p>
    <Link href="/yhteys" className="text-link">Katso yhteystiedot</Link>
  </div>;
  return <form className="quote-calculator" noValidate onSubmit={submit} aria-label="Tarjouspyyntölaskuri">
    <fieldset className="quote-content" disabled={status === "sending"}>
    <div className="quote-progress"><span>Vaihe {step + 1} / 5</span><span>{steps[step]}</span></div>
    <ol className="quote-step-track" aria-label="Laskurin vaiheet">
      {steps.map((title, i) => <li key={title} aria-current={i === step ? "step" : undefined} className={i <= step ? "active" : ""}>
        <span className="sr-only">{i + 1}. {title}{i < step ? ", täytetty" : ""}</span>
      </li>)}
    </ol>
    <Heading ref={headingRef} tabIndex={-1} className="quote-step-title">{titles[step]}</Heading>
    {!enabled && <p className="quote-preview"><strong>Esikatselu.</strong> Pyyntöä ei vielä välitetä YOB:lle. Voit kokeilla laskuria testitiedoilla.</p>}
    {step === 0 && <fieldset className="quote-service-fieldset" id={id("service")}>
      <legend className="sr-only">Valitse työ</legend>
      <div className="quote-service-options">
        {[...services.map((s) => ({ value: s.slug, title: s.title })), { value: "unknown", title: "En tiedä menetelmää" }].map((s) =>
          <label className={`quote-service-option ${values.service === s.value ? "selected" : ""}`} key={s.value}>
            <input type="radio" name={id("service")} value={s.value} checked={values.service === s.value} onChange={() => selectService(s.value)} />
            <span>{s.title}</span>{values.service === s.value && <Check size={18} aria-hidden="true" />}
          </label>)}
      </div>
      <p className="quote-hint">Et tarvitse valmista suunnitelmaa. Voit aloittaa omista havainnoistasi.</p>
    </fieldset>}
    {step === 1 && <div className="form-grid">
      {field("location", "Kohteen paikkakunta *", "text", undefined, true)}
      <div className="field"><label htmlFor={id("propertyType")}>Kohteen tyyppi</label><select id={id("propertyType")} {...register("propertyType")}>
        {["Taloyhtiö", "Omakotitalo", "Liike- tai toimitila", "Työmaa", "Muu kohde", "En tiedä"].map((v) => <option key={v}>{v}</option>)}
      </select></div>
      <div className="field"><label htmlFor={id("customerType")}>Asioin</label><select id={id("customerType")} {...register("customerType")}>
        {["Yksityinen", "Taloyhtiö", "Yritys"].map((v) => <option key={v}>{v}</option>)}
      </select></div>
      {values.customerType !== "Yksityinen" && field("organization", "Yritys tai taloyhtiö", "text", undefined, true)}
    </div>}
    {step === 2 && <div className="form-grid">
      <p className="quote-hint full">Arviot riittävät. Valitse En tiedä, jos mitta tai lähtötieto puuttuu.</p>
      {visibleQuestions(values.service, values.details).map((f) => {
        const key = `details.${f.key}`; const value = values.details[f.key] ?? "";
        const update = (v: string) => setValue(`details.${f.key}`, v);
        return <div className={`field ${f.kind === "text" ? "full" : ""}`} key={f.key}>
          <label htmlFor={id(key)}>{f.label}{f.unit ? ` (${f.unit})` : ""}</label>
          {f.kind === "select" ? <select id={id(key)} value={value} onChange={(e) => update(e.target.value)}>
            {f.options?.map((v) => <option key={v}>{v}</option>)}
          </select> : <input id={id(key)} type="text" inputMode={f.kind === "number" ? f.integer ? "numeric" : "decimal" : "text"}
            maxLength={f.kind === "number" ? 20 : 1000} disabled={value === "unknown"} value={value === "unknown" ? "" : value}
            onChange={(e) => update(e.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? id(key) + "-error" : undefined} />}
          {f.kind === "number" && <label className="quote-unknown"><input type="checkbox" checked={value === "unknown"}
            onChange={(e) => update(e.target.checked ? "unknown" : "")} /> En tiedä mittaa</label>}
          {errors[key] && <small className="field-error" id={id(key) + "-error"}>{errors[key]}</small>}
        </div>;
      })}
    </div>}
    {step === 3 && <div className="form-grid">
      {field("description", "Kohde ja korjaustarve *", "text", "Mitä olet havainnut, missä ja milloin?", true)}
      {field("date", "Toivottu toteutusajankohta", "date", "Vapaaehtoinen. Ei tarkoita ajanvarausta.", true)}
      <div className="field full"><label htmlFor={id("attachments")}><Paperclip size={16} aria-hidden="true" /> Kuvat tai suunnitelmat</label>
        <div className="upload-box"><input ref={fileRef} id={id("attachments")} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf"
          aria-describedby={id("attachments") + "-help"} onChange={(e) => {
            const selected = Array.from(e.target.files ?? []); setFiles(selected);
            const error = attachmentError(selected); setErrors(error ? { attachments: error } : {});
          }} />
          <small id={id("attachments") + "-help"}>Vapaaehtoinen. JPG, PNG, WebP tai PDF. Enintään 3 liitettä ja yhteensä 3 Mt.</small>
          {files.length > 0 && <ul className="quote-files">{files.map((f, i) => <li key={f.name + i}>
            <span>{f.name}</span><button type="button" onClick={() => { const remaining = files.filter((_, n) => n !== i); setFiles(remaining);
              const error = attachmentError(remaining); setErrors(error ? { attachments: error } : {}); if (fileRef.current) fileRef.current.value = "";
            }} aria-label={`Poista liite ${f.name}`}>Poista</button>
          </li>)}</ul>}
        </div>
      </div>
    </div>}
    {step === 4 && <>
      <div className="quote-summary"><div className="quote-summary-heading"><strong>Kohteen tiedot</strong>
        <button type="button" className="text-link" onClick={() => move(0)}>Muokkaa tietoja</button></div>
        <p>{values.location}</p><pre>{summary.split("\n").slice(0, -1).join("\n")}</pre>
        <p className="quote-description">{values.description}</p>
        {values.date && <p>Toivottu ajankohta: {values.date.split("-").reverse().join(".")}</p>}
        <p>Liitteitä: {files.length}</p>
      </div>
      <div className="quote-price" role="status"><strong>Hinta vahvistetaan kohdekohtaisesti.</strong>
        <p>Euromääräistä arviota ei ole laskettu. Työn sisältö ja hinta täsmennetään tarjouksessa.</p></div>
      <div className="form-grid">
        {field("name", "Nimi *", "text", undefined, true)}
        <fieldset className="quote-contact-choice full"><legend>Toivon yhteydenottoa</legend>
          <label><input type="radio" value="email" {...register("preferredContact")} /> Sähköpostilla</label>
          <label><input type="radio" value="phone" {...register("preferredContact")} /> Puhelimitse</label>
        </fieldset>
        {field("email", `Sähköposti${values.preferredContact === "email" ? " *" : ""}`, "email")}
        {field("phone", `Puhelin${values.preferredContact === "phone" ? " *" : ""}`, "tel")}
      </div>
      <div className="honeypot" aria-hidden="true"><label htmlFor={id("website")}>Verkkosivu</label><input id={id("website")} tabIndex={-1} autoComplete="off" {...register("website")} /></div>
      <p className="form-footnote">Tähdellä merkityt yhteystiedot ovat pakollisia. <Link href="/tietosuoja">Lue, miten käsittelemme henkilötietoja.</Link></p>
    </>}
    {(message || Object.keys(errors).length > 0) && <div className="form-error" ref={errorRef} tabIndex={-1} role="alert">
      {message ? <p>{message}</p> : <><strong>Tarkista tiedot.</strong><ul>{Object.entries(errors).map(([key, value]) =>
        <li key={key}><a href={`#${id(key)}`}>{value}</a></li>)}</ul></>}
    </div>}
    <div className="quote-actions">
      {step > 0 && <button className="button quote-back" type="button" disabled={status === "sending"} onClick={() => move(step - 1)}><ArrowLeft size={18} aria-hidden="true" /> Takaisin</button>}
      {step < 4 ? <button className="button" type="button" onClick={next}>Jatka <ArrowRight size={18} aria-hidden="true" /></button>
        : <button className="button" type="submit" disabled={status === "sending"}>{status === "sending" ? "Lähetetään…" : enabled ? "Lähetä tarjouspyyntö" : "Tarkista tarjouspyyntö"}</button>}
    </div>
    <noscript><p>Laskuri tarvitsee JavaScriptin. Ota yhteyttä puhelimitse tai sähköpostilla.</p></noscript>
    </fieldset>
  </form>;
}
