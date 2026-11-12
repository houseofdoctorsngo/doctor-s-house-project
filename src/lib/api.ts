export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(25000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'The service is temporarily unavailable. Please try again.');
  return data as T;
}

export type PublicConfig = { paymentsMode: 'disabled' | 'test' | 'live'; turnstileSiteKey: string | null; assistanceEnabled: boolean };
