// @vitest-environment node
import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ row: {} as Record<string, unknown>, rpc: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.row, error: null }) }) }) }) }),
  rpc: mocks.rpc,
}) }));
import { handleApi } from '../server/api';
const id = '11111111-1111-4111-8111-111111111111';
const token = 'a'.repeat(64);
const secret = 'test-secret';
beforeEach(() => {
  vi.stubEnv('SITE_URL', 'https://ngo.example'); vi.stubEnv('SUPABASE_URL', 'https://db.example');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'server-only'); vi.stubEnv('RAZORPAY_KEY_SECRET', secret);
  mocks.row = { id, order_id: 'order_stored', amount_paise: 100000, name: 'Test Donor', status: 'pending', mode: 'test', created_at: '2026-11-05T00:00:00Z', payment_id: null, amount_refunded: 0 };
  mocks.rpc.mockReset().mockImplementation(async () => ({ data: { ...mocks.row, status: 'captured', payment_id: 'pay_test' }, error: null }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function request(order = 'order_stored') {
  return new Request('https://ngo.example/api/payments/verify', { method: 'POST', headers: { origin: 'https://ngo.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token, paymentId: 'pay_test', signature: createHmac('sha256', secret).update(`${order}|pay_test`).digest('hex') }) });
}
describe('Provider payment verification', () => {
  it('requires a signature for the stored order, not a client-supplied order', async () => {
    const provider = vi.fn(); vi.stubGlobal('fetch', provider);
    expect((await handleApi(request('order_forged')))?.status).toBe(400);
    expect(provider).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each([
    { amount: 1, currency: 'INR', order_id: 'order_stored' },
    { amount: 100000, currency: 'USD', order_id: 'order_stored' },
    { amount: 100000, currency: 'INR', order_id: 'order_other' },
  ])('rejects mismatched provider details: %j', async detail => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ id: 'pay_test', status: 'captured', ...detail })));
    expect((await handleApi(request()))?.status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('does not treat an authorised-only payment as captured', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ id: 'pay_test', order_id: 'order_stored', amount: 100000, currency: 'INR', status: 'authorized' })));
    const response = await handleApi(request());
    expect((await response?.json()).status).toBe('pending'); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('records only a matching captured payment and excludes contact/token data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ id: 'pay_test', order_id: 'order_stored', amount: 100000, currency: 'INR', status: 'captured' })));
    const response = await handleApi(request()); const data = await response?.json();
    expect(data.status).toBe('captured'); expect(data.amount).toBe(1000);
    expect(data).not.toHaveProperty('token_hash'); expect(data).not.toHaveProperty('email');
    expect(mocks.rpc).toHaveBeenCalledWith('record_verified_payment', { donation_id: id, provider_payment_id: 'pay_test', refunded_paise: 0 });
  });
});
