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
  vi.stubEnv('PAYMENTS_MODE', 'test'); vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test_example');
  vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook-secret'); vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'public-key');
  vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('TURNSTILE_SECRET_KEY', '');
  mocks.row = { id, order_id: 'order_stored', amount_paise: 100000, name: 'Test Donor', status: 'pending', mode: 'test', created_at: '2026-11-05T00:00:00Z', payment_id: null, amount_refunded: 0 };
  mocks.rpc.mockReset().mockImplementation(async () => ({ data: { ...mocks.row, status: 'captured', payment_id: 'pay_test' }, error: null }));
});

describe('Interrupted checkout recovery', () => {
  const statusRequest = () => new Request('https://ngo.example/api/payments/status', { method: 'POST', headers: { origin: 'https://ngo.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token }) });
  it('recovers the existing provider order without creating another order', async () => {
    const provider = vi.fn().mockResolvedValue(Response.json({ items: [] })); vi.stubGlobal('fetch', provider);
    const response = await handleApi(statusRequest()); const data = await response?.json();
    expect(data.checkout).toEqual({ orderId: 'order_stored', amount: 100000, keyId: 'rzp_test_example', mode: 'test' });
    expect(provider).toHaveBeenCalledTimes(1);
    expect(provider.mock.calls[0]?.[0]).toBe('https://api.razorpay.com/v1/orders/order_stored/payments');
    expect(provider.mock.calls[0]?.[1].method).toBe('GET');
    expect(JSON.stringify(data)).not.toContain(secret); expect(data).not.toHaveProperty('token_hash');
  });
  it('withholds checkout while a payment is authorised and awaiting capture', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ items: [{ status: 'authorized' }] })));
    const data = await (await handleApi(statusRequest()))?.json();
    expect(data.status).toBe('pending'); expect(data.awaitingCapture).toBe(true); expect(data.checkout).toBeNull();
  });
  it('does not reopen captured donations', async () => {
    mocks.row['status'] = 'captured';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ items: [] })));
    expect((await (await handleApi(statusRequest()))?.json()).checkout).toBeNull();
  });
  it('does not create an order when provider order creation is unresolved', async () => {
    mocks.row['order_id'] = null; const provider = vi.fn(); vi.stubGlobal('fetch', provider);
    expect((await (await handleApi(statusRequest()))?.json()).checkout).toBeNull(); expect(provider).not.toHaveBeenCalled();
  });
  it('blocks old test checkouts after switching to live credentials', async () => {
    vi.stubEnv('PAYMENTS_MODE', 'live'); vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_live_example');
    const provider = vi.fn(); vi.stubGlobal('fetch', provider);
    expect((await handleApi(statusRequest()))?.status).toBe(409); expect((await handleApi(request()))?.status).toBe(409);
    expect(provider).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('still checks existing payments when new donations are paused, without offering checkout', async () => {
    vi.stubEnv('PAYMENTS_MODE', 'disabled');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ items: [] })));
    const response = await handleApi(statusRequest()); expect(response?.status).toBe(200);
    expect((await response?.json()).checkout).toBeNull();
  });
  it('fails closed when payment credentials are missing', async () => {
    vi.stubEnv('RAZORPAY_KEY_SECRET', ''); const provider = vi.fn(); vi.stubGlobal('fetch', provider);
    expect((await handleApi(statusRequest()))?.status).toBe(503); expect(provider).not.toHaveBeenCalled();
  });
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
