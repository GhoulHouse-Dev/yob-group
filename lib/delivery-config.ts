import { storageConfigured } from "./quote/storage";
export function deliveryAvailable() {
  const e = process.env;
  return (
    e.LEAD_INTAKE_ENABLED === "true" &&
    Boolean(e.RESEND_API_KEY && e.LEAD_FROM && e.LEAD_RECIPIENT)
  );
}
export function quoteDeliveryAvailable() { return deliveryAvailable() && storageConfigured(); }
