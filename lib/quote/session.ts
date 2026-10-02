import "server-only";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
export const sessionCookie = "yob_quote_session";
export const receiptCookie = "yob_quote_receipt";
export function signToken(value: string, secret: string, seconds = 7200, purpose = "session") {
  const content = `${value}.${Math.floor(Date.now() / 1000) + seconds}`;
  return `${content}.${createHmac("sha256", secret).update(`${purpose}:${content}`).digest("hex")}`;
}
export function verifyToken(token: string | undefined, secret: string, purpose = "session"): string | null {
  if (!token) return null;
  const [value, expires, signature, extra] = token.split(".");
  if (extra || !/^[a-zA-Z0-9-]{16,64}$/.test(value ?? "") || !/^\d+$/.test(expires ?? "") ||
    !/^[a-f0-9]{64}$/.test(signature ?? "") || Number(expires) <= Date.now() / 1000) return null;
  const expected = createHmac("sha256", secret).update(`${purpose}:${value}.${expires}`).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex")) ? value : null;
}
export function readCookie(request: Request, name: string) {
  return request.headers.get("cookie")?.split(";").map((v) => v.trim()).find((v) => v.startsWith(`${name}=`))?.slice(name.length + 1);
}
export function currentSession(request: Request, secret: string) {
  const value = verifyToken(readCookie(request, sessionCookie), secret);
  return value && /^[a-f0-9-]{36}$/.test(value) ? value : null;
}
export function cookieHeader(name: string, token: string, request: Request, seconds = 7200) {
  return `${name}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
export function newSession() { return randomUUID(); }
