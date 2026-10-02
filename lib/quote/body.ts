export async function readLimitedBody(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader || Number(request.headers.get("content-length") ?? 0) > limit) throw new Error("body-limit");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("body-limit"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let position = 0;
  for (const chunk of chunks) { bytes.set(chunk, position); position += chunk.byteLength; }
  return bytes;
}
