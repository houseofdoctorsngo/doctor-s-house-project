import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export function hashToken(value: string) { return createHash('sha256').update(value).digest('hex'); }
export function validSignature(body: string, signature: string, secret: string) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

export function sameOrigin(request: Request, siteUrl: string) {
  const origin = request.headers.get('origin');
  return origin !== null && origin === new URL(siteUrl).origin;
}

export async function limitedBody(request: Request, limit = 16384) {
  if (Number(request.headers.get('content-length') || 0) > limit) throw new Error('BODY_TOO_LARGE');
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) { await reader.cancel(); throw new Error('BODY_TOO_LARGE'); }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}
