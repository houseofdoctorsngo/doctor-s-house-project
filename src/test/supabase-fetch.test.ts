// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { supabaseFetch } from '../server/supabase-fetch';
afterEach(() => vi.unstubAllGlobals());
describe('Supabase key transport', () => {
  it.each(['sb_publishable_example', 'sb_secret_example'])('sends %s as an API key without treating it as a JWT', async key => {
    const transport = vi.fn().mockResolvedValue(Response.json([])); vi.stubGlobal('fetch', transport);
    await supabaseFetch(key)('https://db.example/rest/v1/assistance_requests', { headers: { authorization: `Bearer ${key}` } });
    const options = transport.mock.calls[0]?.[1];
    expect(options.headers.get('apikey')).toBe(key); expect(options.headers.has('authorization')).toBe(false);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
  it('preserves a legacy bearer token and an existing cancellation signal', async () => {
    const transport = vi.fn().mockResolvedValue(Response.json([])); vi.stubGlobal('fetch', transport);
    const controller = new AbortController();
    await supabaseFetch('legacy-jwt')('https://db.example/rest/v1/donations', { headers: { authorization: 'Bearer legacy-jwt' }, signal: controller.signal });
    const options = transport.mock.calls[0]?.[1];
    expect(options.headers.get('authorization')).toBe('Bearer legacy-jwt');
    controller.abort(); expect(options.signal.aborted).toBe(true);
  });
  it('does not replace a real user JWT with an opaque key', async () => {
    const transport = vi.fn().mockResolvedValue(Response.json([])); vi.stubGlobal('fetch', transport);
    await supabaseFetch('sb_publishable_example')(new Request('https://db.example/rest/v1/donations', { headers: { authorization: 'Bearer user-jwt' } }));
    expect(transport.mock.calls[0]?.[1].headers.get('authorization')).toBe('Bearer user-jwt');
  });
});
