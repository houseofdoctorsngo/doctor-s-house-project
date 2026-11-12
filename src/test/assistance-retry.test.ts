// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ lookup: vi.fn(), insert: vi.fn(), permit: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  from: (table: string) => table === 'submission_permits'
    ? { insert: mocks.permit, delete: () => ({ lt: async () => ({}), eq: async () => ({}) }) }
    : { select: () => ({ eq: () => ({ maybeSingle: mocks.lookup }) }), insert: mocks.insert },
}) }));
import { handleApi } from '../server/api';
const id = '11111111-1111-4111-8111-111111111111';
const details = { name: 'Test Person', phone: '9876543210', village: 'Udaipur', assistance_type: 'Medicines' };
const request = (phone = '+91 9876543210') => new Request('https://ngo.example/api/assistance', {
  method: 'POST', headers: { origin: 'https://ngo.example', 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...details, phone, id, consent: true }),
});
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('TURNSTILE_SECRET_KEY', ''); vi.stubEnv('SITE_URL', 'https://ngo.example');
  vi.stubEnv('SUPABASE_URL', 'https://db.example'); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'server-only'); vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'public-key');
  mocks.lookup.mockReset().mockResolvedValue({ data: null, error: null });
  mocks.insert.mockReset().mockResolvedValue({ error: null }); mocks.permit.mockReset().mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());
describe('Assistance submission retries', () => {
  it.each(['9876543210', '+919876543210', '+91 9876543210'])('binds a normalized phone to the permit and insert: %s', async phone => {
    expect((await handleApi(request(phone)))?.status).toBe(201);
    expect(mocks.permit).toHaveBeenCalledWith(expect.objectContaining({ request_id: id, payload: details }));
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ ...details, id }));
  });
  it('recognizes equivalent phone formatting on a saved request without another insert', async () => {
    mocks.lookup.mockResolvedValue({ data: { ...details, phone: '+91 9876543210' }, error: null });
    expect((await handleApi(request()))?.status).toBe(200); expect(mocks.insert).not.toHaveBeenCalled();
  });
  it('acknowledges a matching concurrent insert', async () => {
    mocks.lookup.mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: details, error: null });
    mocks.insert.mockResolvedValue({ error: { code: '23505' } });
    const response = await handleApi(request()); expect(response?.status).toBe(200); expect(await response?.json()).toEqual({ id });
  });
  it('rejects a conflicting concurrent insert instead of reporting false success', async () => {
    mocks.lookup.mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: { ...details, village: 'Different Village' }, error: null });
    mocks.insert.mockResolvedValue({ error: { code: '23505' } });
    expect((await handleApi(request()))?.status).toBe(409);
  });
  it('does not claim success if a raced insert cannot be verified', async () => {
    mocks.insert.mockResolvedValue({ error: { code: '23505' } });
    expect((await handleApi(request()))?.status).toBe(503);
  });
});
