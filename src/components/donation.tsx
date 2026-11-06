import { useEffect, useState, type FormEvent } from 'react';
import { Heart, LockKeyhole, ShieldCheck, ArrowRight, Download, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { HumanVerification } from './human-verification';
import { defaultDonation, donationPresets, donorSchema, formatINR } from '@/lib/ngo';
import { api, type PublicConfig } from '@/lib/api';

type CheckoutResult = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type Checkout = { open: () => void; on: (event: string, callback: () => void) => void };
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => Checkout } }
type Pending = { id: string; token: string; orderId?: string; keyId?: string; amount?: number; mode?: string };
type Confirmation = { id: string; name: string; amount: number; orderId: string | null; paymentId: string | null; status: string; mode: string; date: string; refunded: number };
const storageKey = 'thd-donation-session';
let sdk: Promise<void> | undefined;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!sdk) sdk = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { sdk = undefined; script.remove(); reject(new Error('Payment checkout could not load. Check your connection and try again.')); };
    document.head.appendChild(script);
  });
  return sdk;
}
export function Donation() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [preset, setPreset] = useState<number | string>(defaultDonation);
  const [custom, setCustom] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [humanToken, setHumanToken] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const amount = preset === 'Custom' ? Number(custom) : Number(preset);
  useEffect(() => {
    api<PublicConfig>('/api/config').then(setConfig).catch(() => setMessage('Online donations are currently unavailable. Please contact our team.'));
    try { const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); if (saved && typeof saved.id === 'string' && /^[a-f0-9]{64}$/.test(saved.token)) setPending(saved); } catch { /* Storage may be disabled. */ }
  }, []);
  function remember(value: Pending | null) {
    setPending(value);
    try { if (value) sessionStorage.setItem(storageKey, JSON.stringify(value)); else sessionStorage.removeItem(storageKey); } catch { /* Checkout still works without storage. */ }
  }
  async function check(current = pending) {
    if (!current) return null;
    const result = await api<Confirmation>('/api/payments/status', current);
    setConfirmation(result);
    if (result.status === 'pending') setMessage('Payment is not confirmed yet. If money was debited, wait and check again; do not make a second payment.');
    else setMessage('');
    return result;
  }
  async function openCheckout(current: Pending, prefill?: Record<string, string>) {
    if (!current.orderId || !current.keyId || !current.amount) throw new Error('Order creation is unresolved. Contact our team with the reference below.');
    await loadCheckout();
    if (!window.Razorpay) throw new Error('Payment provider did not load.');
    const checkout = new window.Razorpay({
      key: current.keyId, order_id: current.orderId, amount: current.amount, currency: 'INR', name: 'The House of Doctor', description: 'Donation for rural healthcare', prefill,
      modal: { ondismiss: () => { setBusy(false); setMessage('Checkout closed. Check payment status before making another donation.'); } },
      handler: async (result: CheckoutResult) => {
        setBusy(true);
        try {
          const verified = await api<Confirmation>('/api/payments/verify', { id: current.id, token: current.token, paymentId: result.razorpay_payment_id, signature: result.razorpay_signature });
          setConfirmation(verified);
          setMessage(verified.status === 'pending' ? 'Payment is awaiting capture. Please check its status shortly; do not pay again.' : '');
        } catch (error) { setMessage(error instanceof Error ? error.message : 'Confirmation pending. Check payment status.'); }
        finally { setBusy(false); }
      },
      theme: { color: '#25345e' },
    });
    checkout.on('payment.failed', () => { setBusy(false); setMessage('The payment attempt failed. Check the status before retrying this checkout.'); });
    checkout.open();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const fields = new FormData(event.currentTarget);
    const parsed = donorSchema.safeParse({ name: fields.get('name'), email: fields.get('email'), phone: fields.get('phone'), amount });
    if (!parsed.success) { setMessage(parsed.error.issues[0]?.message || 'Check your details.'); return; }
    setBusy(true); setMessage('');
    const current: Pending = { id: crypto.randomUUID(), token: Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('') };
    remember(current);
    try {
      const order = await api<{ orderId: string; amount: number; keyId: string; mode: string }>('/api/payments/order', { ...parsed.data, ...current, humanToken, consent: fields.get('consent') === 'on', website: fields.get('website') });
      const ready = { ...current, ...order }; remember(ready);
      await openCheckout(ready, { name: parsed.data.name, email: parsed.data.email, contact: parsed.data.phone });
    } catch (error) { setBusy(false); setMessage(error instanceof Error ? error.message : 'Unable to open checkout.'); }
    finally { setHumanToken(''); setResetKey(key => key + 1); }
  }
  async function action(callback: () => Promise<unknown>) {
    setBusy(true); setMessage('');
    try { await callback(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to complete the request.'); } finally { setBusy(false); }
  }
  async function download() {
    const result = await check();
    if (!result || result.status === 'pending') return;
    const { jsPDF } = await import('jspdf'); const pdf = new jsPDF();
    pdf.setFontSize(22); pdf.text('The House of Doctor', 20, 25);
    pdf.setFontSize(14); pdf.text(result.mode === 'test' ? 'TEST PAYMENT - NO MONEY RECEIVED' : 'Payment acknowledgement', 20, 40);
    pdf.setFontSize(10);
    const lines = [
      'Udaipur, Rajasthan | +91 75688 96804', 'houseofdoctorsngo@gmail.com', '',
      `Reference: ${result.id}`, `Order: ${result.orderId}`, `Payment: ${result.paymentId}`,
      `Donor: ${result.name}`, `Amount: INR ${result.amount.toLocaleString('en-IN')}`, `Status: ${result.status}`,
      `Refunded: INR ${result.refunded.toLocaleString('en-IN')}`, `Order date: ${new Date(result.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      '', 'This is not an official donation receipt, settlement confirmation or tax certificate.',
      'Contact the NGO for an official receipt after settlement and reconciliation.', 'No 80G eligibility or tax deduction is asserted by this acknowledgement.',
    ];
    let y = 54; for (const line of lines) { const wrapped = pdf.splitTextToSize(line, 170); pdf.text(wrapped, 20, y); y += wrapped.length * 6 + 3; }
    pdf.save(`THD-${result.id}-acknowledgement.pdf`);
  }
  return <section id="donate" className="site-width py-8">
    <p className="eyebrow text-destructive"><Heart size={12}/> A LITTLE HELP. A LASTING IMPACT.</p>
    <h2 className="section-title gold-text mt-2">Fund a camp. Save a life.</h2>
    <p className="mt-3 text-sm text-muted-foreground">Support medical camps, medicines and care for rural communities across Mewar.</p>
    <div className="grid md:grid-cols-2 gap-5 mt-5">
      <div className="card-3d p-6"><span className="icon-badge mb-3"><Heart/></span><h3 className="text-xl mb-4">Choose your contribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{[...donationPresets, 'Custom'].map(value => <Button key={value} variant="choice" disabled={!!pending || busy} aria-pressed={preset === value} onClick={() => setPreset(value)}>{typeof value === 'number' ? formatINR(value) : value}</Button>)}</div>
        {preset === 'Custom' && <label className="block mt-3"><span className="field-label">Custom amount (INR)</span><input className="field" type="number" min="1" max="10000000" step="1" disabled={!!pending || busy} value={custom} onChange={event => setCustom(event.target.value)} required/></label>}
        <div className="bg-heal-soft rounded-xl p-4 mt-5 text-sm leading-7"><ShieldCheck className="mb-2"/><p>Choose UPI, card or netbanking in Razorpay checkout, subject to provider availability. Card details and UPI PINs are entered only with the payment provider.</p></div>
        <p className="text-xs leading-6 mt-4">For other payment arrangements, <a href="tel:+917568896804" className="underline">contact our team</a>. Please verify the recipient before transferring funds.</p>
        <p className="text-xs mt-3"><a href="#refunds" className="underline">Donation questions and refunds</a></p>
      </div>
      <div className="card-3d p-6">
        {config?.paymentsMode === 'test' && <p role="status" className="bg-heal-soft p-3 rounded-lg text-sm mb-4">Test mode — no real donation is collected.</p>}
        {pending ? <div className="space-y-4"><CheckCircle2/><h3 className="text-xl">{confirmation && confirmation.status !== 'pending' ? (confirmation.mode === 'test' ? 'Test payment verified' : 'Payment verified') : 'Your donation checkout'}</h3>
          <p className="text-xs break-all">Reference: {pending.id}</p>
          {confirmation && <dl className="text-sm space-y-2"><div>Amount: {formatINR(confirmation.amount)}</div><div>Status: {confirmation.status.replaceAll('_', ' ')}</div>{confirmation.refunded > 0 && <div>Refunded: {formatINR(confirmation.refunded)}</div>}</dl>}
          <Button variant="heal" className="w-full" disabled={busy} onClick={() => action(() => check())}>Check payment status</Button>
          {(!confirmation || confirmation.status === 'pending') && pending.orderId && config?.paymentsMode !== 'disabled' && <Button className="w-full" variant="mission" disabled={busy} onClick={() => action(async () => { const result = await check(); if (result?.status === 'pending') await openCheckout(pending); })}>Resume this checkout</Button>}
          {confirmation && confirmation.status !== 'pending' && <><Button variant="mission" className="w-full" disabled={busy} onClick={() => action(download)}><Download/>Download acknowledgement</Button><p className="text-xs leading-6">This is not an official donation receipt or tax certificate. Contact the NGO after settlement for an official receipt.</p><Button variant="ghost" onClick={() => { remember(null); setConfirmation(null); setMessage(''); }}>Start another donation</Button></>}
          {(!confirmation || confirmation.status === 'pending') && <Button variant="ghost" className="text-xs whitespace-normal h-auto" disabled={busy} onClick={() => { if (window.confirm('Only clear this checkout if you have not paid or authorised a payment. If money was debited or the result is uncertain, cancel and contact the NGO with your reference. Clear the checkout?')) { remember(null); setConfirmation(null); setMessage(''); } }}>Clear unpaid checkout and change details</Button>}
        </div> : <form onSubmit={submit}><h3 className="text-xl mb-4">A gift from you. Hope for someone.</h3>
          <div className="grid sm:grid-cols-2 gap-3"><label><span className="field-label">Full name</span><input name="name" autoComplete="name" className="field" required minLength={2} maxLength={100}/></label><label><span className="field-label">Email</span><input name="email" autoComplete="email" className="field" type="email" required maxLength={255}/></label><label className="sm:col-span-2"><span className="field-label">Mobile number</span><input name="phone" autoComplete="tel" className="field" type="tel" placeholder="+91 9876543210" required maxLength={14}/></label></div>
          <label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
          <label className="flex gap-2 items-start text-xs leading-5 mt-4"><input name="consent" type="checkbox" required className="mt-1"/><span>I agree to the <a href="#terms" className="underline">donation terms</a> and processing of my details as described in the <a href="#privacy" className="underline">privacy information</a>.</span></label>
          <HumanVerification siteKey={config?.turnstileSiteKey || null} action="donation" onToken={setHumanToken} resetKey={resetKey}/>
          <Button variant="mission" type="submit" className="w-full mt-5" disabled={busy || !config || config.paymentsMode === 'disabled' || (!!config.turnstileSiteKey && !humanToken)}><LockKeyhole size={14}/>{busy ? 'Opening checkout…' : `Donate ${formatINR(amount || 0)}`}<ArrowRight className="ml-auto"/></Button>
          {config?.paymentsMode === 'disabled' && <p className="text-xs leading-6 mt-3">Online donations are not enabled yet. No payment is taken here. Call our team for verified donation arrangements.</p>}
        </form>}
        {message && <p role="alert" className="text-sm leading-6 mt-4">{message}</p>}
      </div>
    </div>
  </section>;
}
