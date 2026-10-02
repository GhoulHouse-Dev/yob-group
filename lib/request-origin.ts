// Next.js may construct request.url from an internal listening hostname.
// The HTTP Host identifies the actual destination chosen by the browser.
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let expected = new URL(request.url);
  const host = request.headers.get("host");
  if (host) {
    if (!/^[a-z0-9.\-:\[\]]+$/i.test(host)) return false;
    try { expected = new URL(`${expected.protocol}//${host}`); }
    catch { return false; }
  }
  return origin === expected.origin;
}
