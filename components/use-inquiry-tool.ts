"use client";
import {
  useEffect,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from "react";
import { inquirySchema } from "@/lib/inquiry";
type ToolContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => Promise<unknown>;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};

// Optional progressive enhancement. This only prepares the existing form;
// sending still requires the visible submit action and the server's gates.
export function useInquiryTool(
  form: RefObject<HTMLFormElement | null>,
  setService: Dispatch<SetStateAction<string>>,
  enabled: boolean,
  active: boolean,
) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ToolContext })
      .modelContext;
    if (!active || !context?.registerTool) return;
    const lifecycle = new AbortController();
    const registration = {
      name: "stage_kohdearviopyynto",
      title: "Valmistele kohdearviopyyntö",
      description:
        "Tarkista tiedot ja täytä näkyvä kohdearviolomake. Ei lähetä viestiä eikä lisää liitteitä. Käyttäjän pitää tarkistaa lomake ja lähettää se erikseen.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: Object.fromEntries(
          [
            "name",
            "phone",
            "email",
            "location",
            "description",
            "organization",
            "service",
            "date",
          ].map((key) => [key, { type: "string" }]),
        ),
        required: ["name", "location", "description"],
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      async execute(input: unknown) {
        if (!input || typeof input !== "object" || Array.isArray(input))
          return { ok: false, message: "Anna lomakkeen tiedot objektina." };
        const result = inquirySchema.safeParse({
          phone: "",
          email: "",
          organization: "",
          service: "unknown",
          date: "",
          website: "",
          ...input,
        });
        if (!result.success)
          return {
            ok: false,
            errors: result.error.issues.map((issue) => ({
              field: String(issue.path[0]),
              message: issue.message,
            })),
          };
        const element = form.current;
        if (!element)
          return { ok: false, message: "Lomake ei ole käytettävissä." };
        for (const [key, value] of Object.entries(result.data)) {
          const control = element.elements.namedItem(key);
          if (
            control instanceof HTMLInputElement ||
            control instanceof HTMLTextAreaElement
          )
            control.value = value;
        }
        setService(result.data.service);
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        return {
          ok: true,
          status: "prepared",
          deliveryEnabled: enabled,
          message:
            "Tiedot ovat näkyvällä lomakkeella. Tarkista ja lähetä lomake erikseen.",
        };
      },
    };
    try {
      void Promise.resolve(
        context.registerTool(registration, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {
      /* Unsupported registration must not break the visitor's form. */
    }
    return () => lifecycle.abort();
  }, [form, setService, enabled, active]);
}
