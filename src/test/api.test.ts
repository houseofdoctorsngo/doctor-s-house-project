// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleApi } from '../server/api';

afterEach(() => vi.unstubAllEnvs());
describe('Public API configuration and failures', () => {
  it('supports a fresh project secret key without exposing it in public configuration', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('SITE_URL', 'https://ngo.example');
    vi.stubEnv('SUPABASE_URL', 'https://db.example'); vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_private');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', ''); vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_example');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'private-widget'); vi.stubEnv('TURNSTILE_SITE_KEY', 'public-widget');
    const data = await (await handleApi(new Request('https://ngo.example/api/config')))?.json();
    expect(data.assistanceEnabled).toBe(true); expect(JSON.stringify(data)).not.toContain('sb_secret_private');
  });
  it.each(['', 'not-a-url', 'https://ngo.example/a-path', 'http://ngo.example', 'https://user:password@ngo.example'])('disables production forms for an invalid SITE_URL: %s', async url => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('SITE_URL', url);
    vi.stubEnv('SUPABASE_URL', 'https://db.example'); vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_private');
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_example');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'private-widget'); vi.stubEnv('TURNSTILE_SITE_KEY', 'public-widget');
    const data = await (await handleApi(new Request('https://ngo.example/api/config')))?.json();
    expect(data.assistanceEnabled).toBe(false); expect(data.paymentsMode).toBe('disabled');
  });
  it('serves a healthcheck without requiring provider credentials', async () => {
    const response = await handleApi(new Request('https://ngo.example/api/health'));
    expect(response?.status).toBe(200);
  });
  it('does not enable live payments with test credentials', async () => {
    vi.stubEnv('PAYMENTS_MODE', 'live'); vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test_example');
    const response = await handleApi(new Request('https://ngo.example/api/config'));
    const data = await response?.json();
    expect(data.paymentsMode).toBe('disabled');
    expect(JSON.stringify(data)).not.toContain('rzp_test_example');
  });
  it('rejects untrusted origins before accessing database', async () => {
    vi.stubEnv('SITE_URL', 'https://ngo.example');
    const response = await handleApi(new Request('https://ngo.example/api/assistance', { method: 'POST', headers: { origin: 'https://attacker.example', 'Content-Type': 'application/json' }, body: '{}' }));
    expect(response?.status).toBe(403);
  });
  it('rejects unsigned webhook events', async () => {
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'test-secret');
    const response = await handleApi(new Request('https://ngo.example/api/payments/webhook', { method: 'POST', body: '{}' }));
    expect(response?.status).toBe(401);
  });
  it('rejects malformed and oversize requests before database writes', async () => {
    vi.stubEnv('SITE_URL', 'https://ngo.example');
    const request = (body: string) => new Request('https://ngo.example/api/assistance', { method: 'POST', headers: { origin: 'https://ngo.example', 'Content-Type': 'application/json' }, body });
    expect((await handleApi(request('{')))?.status).toBe(400);
    expect((await handleApi(request('x'.repeat(17000))))?.status).toBe(413);
  });
});
