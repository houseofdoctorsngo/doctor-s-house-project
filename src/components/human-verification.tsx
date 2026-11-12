import { useEffect, useRef, useState } from 'react';

type Turnstile = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: Turnstile } }
let loading: Promise<void> | undefined;
function load() {
  if (window.turnstile) return Promise.resolve();
  if (!loading) loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { loading = undefined; script.remove(); reject(new Error('Unable to load verification')); };
    document.head.appendChild(script);
  });
  return loading;
}
export function HumanVerification({ siteKey, action, onToken, resetKey }: { siteKey: string | null; action: string; onToken: (token: string) => void; resetKey: number }) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  callback.current = onToken;
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false; let widget: string | undefined;
    setError(false); callback.current('');
    load().then(() => {
      if (cancelled || !container.current) return;
      widget = window.turnstile?.render(container.current, { sitekey: siteKey, action, size: 'flexible', callback: (token: string) => callback.current(token), 'expired-callback': () => callback.current(''), 'error-callback': () => { callback.current(''); setError(true); } });
    }).catch(() => setError(true));
    return () => { cancelled = true; if (widget) window.turnstile?.remove(widget); };
  }, [siteKey, action, resetKey]);
  return <><div ref={container} className="mt-3 min-w-0"/>{error && <p role="alert" className="text-xs text-destructive mt-2">Verification could not load. Refresh or call our team.</p>}</>;
}
