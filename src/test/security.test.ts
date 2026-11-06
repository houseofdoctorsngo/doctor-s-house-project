// @vitest-environment node
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { hashToken, limitedBody, sameOrigin, validSignature } from '../server/security';

describe('Payment and request boundaries', () => {
  it('accepts a matching payment signature and rejects tampered orders', () => {
    const body = 'order_123|pay_456'; const secret = 'test-only-secret';
    const signature = createHmac('sha256', secret).update(body).digest('hex');
    expect(validSignature(body, signature, secret)).toBe(true);
    expect(validSignature('order_OTHER|pay_456', signature, secret)).toBe(false);
    expect(validSignature(body, 'x'.repeat(64), secret)).toBe(false);
    expect(validSignature(body, '00', secret)).toBe(false);
  });
  it('validates webhook bytes without normalising JSON', () => {
    const body = '{ "event": "payment.captured" }';
    const signature = createHmac('sha256', 'webhook-test').update(body).digest('hex');
    expect(validSignature(body, signature, 'webhook-test')).toBe(true);
    expect(validSignature(JSON.stringify(JSON.parse(body)), signature, 'webhook-test')).toBe(false);
  });
  it('rejects missing and cross-site request origins', () => {
    expect(sameOrigin(new Request('https://ngo.example/api', { headers: { origin: 'https://ngo.example' } }), 'https://ngo.example')).toBe(true);
    expect(sameOrigin(new Request('https://ngo.example/api', { headers: { origin: 'https://attacker.example' } }), 'https://ngo.example')).toBe(false);
    expect(sameOrigin(new Request('https://ngo.example/api'), 'https://ngo.example')).toBe(false);
  });
  it('limits bodies even when Content-Length is absent', async () => {
    await expect(limitedBody(new Request('https://ngo.example/api', { method: 'POST', body: '12345' }), 4)).rejects.toThrow('BODY_TOO_LARGE');
    await expect(limitedBody(new Request('https://ngo.example/api', { method: 'POST', body: '1234' }), 4)).resolves.toBe('1234');
  });
  it('stores access-token digests rather than raw tokens', () => {
    expect(hashToken('a')).toHaveLength(64);
    expect(hashToken('a')).not.toEqual(hashToken('b'));
  });
});
