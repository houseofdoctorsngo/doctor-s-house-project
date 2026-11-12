// @vitest-environment node
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ lookup: vi.fn(), rpc: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.lookup }) }) }), rpc: mocks.rpc,
}) }));
import { handleApi } from '../server/api';
const secret = 'test-webhook-secret';
const payment = { id: 'pay_test', order_id: 'order_test', amount: 50000, currency: 'INR', status: 'captured', amount_refunded: 0 };
const row = { id: '11111111-1111-4111-8111-111111111111', order_id: 'order_test', amount_paise: 50000, mode: 'test' };
const event = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_test' } } } };
function request(value: unknown, changeBody = false) {
  const body = JSON.stringify(value);
  return new Request('https://ngo.example/api/payments/webhook', { method: 'POST', headers: {
    'x-razorpay-signature': createHmac('sha256', secret).update(body).digest('hex'),
  }, body: changeBody ? body + ' ' : body });
}
beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://db.example'); vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_example');
  vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', secret); vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test_example'); vi.stubEnv('RAZORPAY_KEY_SECRET', 'api-secret');
  mocks.lookup.mockReset().mockResolvedValue({ data: row, error: null }); mocks.rpc.mockReset().mockResolvedValue({ data: row, error: null });
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json(payment)));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('Signed payment webhooks', () => {
  it('verifies payment state at the provider before recording a signed event without a browser origin', async () => {
    expect((await handleApi(request(event)))?.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith('https://api.razorpay.com/v1/payments/pay_test', expect.anything());
    expect(mocks.rpc).toHaveBeenCalledWith('record_verified_payment', { donation_id: row.id, provider_payment_id: 'pay_test', refunded_paise: 0 });
  });
  it('rejects a raw-body change even if the JSON is equivalent', async () => {
    expect((await handleApi(request(event, true)))?.status).toBe(401); expect(fetch).not.toHaveBeenCalled();
  });
  it('uses the provider refund total for refund-only events', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ ...payment, status: 'refunded', amount_refunded: 50000 }));
    expect((await handleApi(request({ event: 'refund.processed', payload: { refund: { entity: { payment_id: 'pay_test' } } } })))?.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith('record_verified_payment', { donation_id: row.id, provider_payment_id: 'pay_test', refunded_paise: 50000 });
  });
  it.each([null, {}, { event: 'payment.captured', payload: {} }])('rejects malformed signed events: %j', async value => {
    expect((await handleApi(request(value)))?.status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('acknowledges unrelated events without accessing services', async () => {
    expect((await handleApi(request({ event: 'unrelated.event' })))?.status).toBe(200); expect(fetch).not.toHaveBeenCalled();
  });
  it('acknowledges orders from other merchant integrations without writing', async () => {
    mocks.lookup.mockResolvedValue({ data: null, error: null });
    expect((await handleApi(request(event)))?.status).toBe(200); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('rejects a provider amount mismatch', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ ...payment, amount: 1 }));
    expect((await handleApi(request(event)))?.status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('returns a retryable response when persistence is unavailable', async () => {
    mocks.lookup.mockResolvedValue({ data: null, error: { code: 'unavailable' } });
    expect((await handleApi(request(event)))?.status).toBe(503); expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
