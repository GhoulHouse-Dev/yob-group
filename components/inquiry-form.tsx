"use client";
import Link from "next/link";
import { useInquiryTool } from "@/components/use-inquiry-tool";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { services } from "@/lib/site";
import { inquirySchema, attachmentError } from "@/lib/inquiry";
export function InquiryForm({
  initialService,
  enabled = false,
}: {
  initialService?: string;
  enabled?: boolean;
}) {
  const [service, setService] = useState(
    services.some((s) => s.slug === initialService)
      ? initialService!
      : "unknown",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "success">("idle");
  const [files, setFiles] = useState<File[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  useInquiryTool(formRef, setService, enabled, state !== "success");
  const errorRef = useRef<HTMLDivElement>(null);
  const submission = useRef<{
    signature: string;
    key: string;
  } | null>(null);
  const prefix = "inquiry-" + (initialService ?? "general");
  function focusError() {
    requestAnimationFrame(() => errorRef.current?.focus());
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const data = new FormData(e.currentTarget);
    data.set("service", service);
    const parsed = inquirySchema.safeParse(
      Object.fromEntries(
        [...data.entries()].filter(([k]) => k !== "attachments"),
      ),
    );
    const next: Record<string, string> = {};
    if (!parsed.success)
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0]);
        next[k] ??= issue.message;
      }
    const fileError = attachmentError(files);
    if (fileError) next.attachments = fileError;
    if (Object.keys(next).length) {
      setErrors(next);
      setMessage("");
      focusError();
      return;
    }
    setErrors({});
    setState("sending");
    setMessage("");
    data.delete("attachments");
    for (const file of files) data.append("attachments", file);
    const signature = JSON.stringify(
      [...data.entries()].map(([k, v]) => [
        k,
        typeof v === "string" ? v : [v.name, v.size, v.lastModified],
      ]),
    );
    if (submission.current?.signature !== signature) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      submission.current = {
        signature,
        key: Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""),
      };
    }
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        body: data,
        headers: { "Idempotency-Key": submission.current!.key },
      });
      const result = (await res.json()) as {
        ok?: boolean;
        message?: string;
        errors?: Record<string, string>;
      };
      if (!res.ok || !result.ok) {
        setErrors(result.errors ?? {});
        setMessage(
          result.message ??
            "Pyyntöä ei voitu lähettää. Tietosi ovat edelleen lomakkeella.",
        );
        setState("idle");
        focusError();
        return;
      }
      setState("success");
    } catch {
      setState("idle");
      setMessage(
        "Pyyntöä ei voitu lähettää. Tietosi ovat edelleen lomakkeella. Yritä uudelleen tai ota yhteyttä puhelimitse tai sähköpostilla.",
      );
      focusError();
    }
  }
  const id = (name: string) => prefix + "-" + name;
  function input(
    name: string,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
    help?: string,
    full = false,
  ) {
    return (
      <div className={"field " + (full ? "full" : "")} key={name}>
        <label htmlFor={id(name)}>{label}</label>
        <Input
          id={id(name)}
          name={name}
          {...props}
          aria-invalid={!!errors[name]}
          aria-describedby={
            errors[name]
              ? id(name) + "-error"
              : help
                ? id(name) + "-help"
                : undefined
          }
        />
        {help && <small id={id(name) + "-help"}>{help}</small>}
        {errors[name] && (
          <small className="field-error" id={id(name) + "-error"}>
            {errors[name]}
          </small>
        )}
      </div>
    );
  }
  if (state === "success")
    return (
      <div className="form-notice" role="status">
        <h3>Kiitos.</h3>
        <p>Kohdearviopyyntösi on vastaanotettu.</p>
        <Link href="/" className="text-link">
          Palaa etusivulle
        </Link>
      </div>
    );
  return (
    <form
      ref={formRef}
      className="inquiry-form"
      noValidate
      onSubmit={submit}
      aria-label="Kohdearviopyyntö"
    >
      {!enabled && (
        <p className="form-notice">
          <strong>Esikatselulomake.</strong> Pyyntöä ei välitetä YOB:lle. Voit
          kokeilla lomaketta testitiedoilla tai ottaa yhteyttä puhelimitse tai
          sähköpostilla.
        </p>
      )}
      <div className="form-grid">
        {input(
          "name",
          "Nimi *",
          { autoComplete: "name", maxLength: 100, required: true },
          undefined,
          true,
        )}
        {input(
          "phone",
          "Puhelin",
          { type: "tel", autoComplete: "tel", maxLength: 40 },
          "Anna puhelinnumero tai sähköposti.",
        )}
        {input("email", "Sähköposti", {
          type: "email",
          autoComplete: "email",
          maxLength: 254,
        })}
        {input(
          "location",
          "Kohteen paikkakunta *",
          { autoComplete: "address-level2", maxLength: 100, required: true },
          undefined,
          true,
        )}
        <div className="field full">
          <label htmlFor={id("description")}>Kohde ja korjaustarve *</label>
          <Textarea
            id={id("description")}
            name="description"
            maxLength={5000}
            required
            aria-invalid={!!errors.description}
            aria-describedby={
              id("description") +
              "-help" +
              (errors.description ? " " + id("description") + "-error" : "")
            }
          />
          <small id={id("description") + "-help"}>
            Millaisesta kohteesta on kyse? Mitä olet havainnut ja missä
            kohdassa?
          </small>
          {errors.description && (
            <small className="field-error" id={id("description") + "-error"}>
              {errors.description}
            </small>
          )}
        </div>
        {input("organization", "Yritys tai taloyhtiö", {
          autoComplete: "organization",
          maxLength: 150,
        })}
        <div className="field">
          <label htmlFor={id("service")}>Palvelu</label>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger id={id("service")} aria-invalid={!!errors.service}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="select-options">
              <SelectItem value="unknown">En tiedä vielä</SelectItem>
              {services.map((s) => (
                <SelectItem value={s.slug} key={s.slug}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {input(
          "date",
          "Toivottu ajankohta",
          { type: "date" },
          "Vapaaehtoinen. Ei tarkoita ajanvarausta.",
          true,
        )}
        <div className="field full">
          <label htmlFor={id("attachments")}>Kuvat tai suunnitelmat</label>
          <div className="upload-box">
            <input
              id={id("attachments")}
              name="attachments"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              aria-describedby={
                id("attachments") +
                "-help" +
                (errors.attachments ? " " + id("attachments") + "-error" : "")
              }
              aria-invalid={!!errors.attachments}
              onChange={(e) => {
                const f = Array.from(e.target.files ?? []);
                setFiles(f);
                const err = attachmentError(f);
                setErrors((previous) => {
                  const next = { ...previous };
                  delete next.attachments;
                  if (err) next.attachments = err;
                  return next;
                });
              }}
            />
            <small id={id("attachments") + "-help"}>
              Vapaaehtoinen. JPG, PNG, WebP tai PDF. Enintään 3 tiedostoa, 5 Mt
              / tiedosto ja 8 Mt yhteensä.
            </small>
            {files.length > 0 && (
              <ul className="file-list">
                {files.map((f, i) => (
                  <li key={f.name + i}>{f.name}</li>
                ))}
              </ul>
            )}
            {errors.attachments && (
              <small className="field-error" id={id("attachments") + "-error"}>
                {errors.attachments}
              </small>
            )}
          </div>
        </div>
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={id("website")}>Verkkosivu</label>
        <input
          id={id("website")}
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {(message || Object.keys(errors).length > 0) && (
        <div ref={errorRef} className="form-error" role="alert" tabIndex={-1}>
          {message ? (
            <p>{message}</p>
          ) : (
            <>
              <strong>Tarkista lomakkeen tiedot.</strong>
              <ul>
                {Object.entries(errors).map(([key, value]) => (
                  <li key={key}>
                    <a href={"#" + id(key)}>{value}</a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      <p className="form-footnote">
        Tähdellä merkityt kentät ovat pakollisia. Lisäksi tarvitaan
        puhelinnumero tai sähköpostiosoite.
        <br />
        <Link href="/tietosuoja">Lue, miten käsittelemme henkilötietoja.</Link>
      </p>
      <Button
        className="button submit-button"
        type="submit"
        disabled={state === "sending"}
      >
        {state === "sending" ? "Lähetetään…" : "Lähetä kohdearviopyyntö"}
      </Button>
      <noscript>
        <p>
          Ota yhteyttä puhelimitse tai sähköpostilla. Lomake tarvitsee
          JavaScriptin.
        </p>
      </noscript>
    </form>
  );
}
