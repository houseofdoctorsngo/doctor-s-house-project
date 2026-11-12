// Supabase's opaque API keys belong in apikey, not in a JWT bearer header.
// Keep real user JWTs and legacy service-role JWTs unchanged.
export function supabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
    if (/^sb_(publishable|secret)_/.test(key) && headers.get('authorization') === `Bearer ${key}`) headers.delete('authorization');
    headers.set('apikey', key);
    const originalSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    const timeout = AbortSignal.timeout(12000);
    return fetch(input, { ...init, headers, signal: originalSignal ? AbortSignal.any([originalSignal, timeout]) : timeout });
  };
}
