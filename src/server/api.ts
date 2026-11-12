import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { assistanceSchema, donorSchema, normalizeIndianPhone } from '../lib/ngo';
import { hashToken, limitedBody, sameOrigin, validSignature } from './security';
import { supabaseFetch } from './supabase-fetch';

class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
const env = (key: string) => process.env[key] || '';
const secretKey = () => env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY');
function siteOrigin() {
  try {
    const url = new URL(env('SITE_URL'));
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    if (env('NODE_ENV') === 'production' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch { return null; }
}
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
function database(admin = true) {
  const key = admin ? secretKey() : env('SUPABASE_PUBLISHABLE_KEY');
  if (!env('SUPABASE_URL') || !key) throw new ApiError(503, 'Online requests are temporarily unavailable. Please call +91 75688 96804.');
  return createClient(env('SUPABASE_URL'), key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: supabaseFetch(key) },
  });
}
function mode(): 'disabled' | 'test' | 'live' {
  const value = env('PAYMENTS_MODE');
  if ((value === 'test' || value === 'live') && env('RAZORPAY_KEY_ID').startsWith(`rzp_${value}_`) && env('RAZORPAY_KEY_SECRET') && env('RAZORPAY_WEBHOOK_SECRET') && secretKey() && env('SUPABASE_URL')) return value;
  return 'disabled';
}
function formsReady() {
  return !!(siteOrigin() && env('SUPABASE_URL') && secretKey() && env('SUPABASE_PUBLISHABLE_KEY') &&
    (env('NODE_ENV') !== 'production' || (env('TURNSTILE_SECRET_KEY') && env('TURNSTILE_SITE_KEY'))));
}
async function checkHuman(token: string, action: string) {
  if (!env('TURNSTILE_SECRET_KEY')) {
    if (env('NODE_ENV') === 'production') throw new ApiError(503, 'Online forms are not configured yet. Please contact our team.');
    return;
  }
  if (!token) throw new ApiError(400, 'Please complete the verification before submitting.');
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', body: new URLSearchParams({ secret: env('TURNSTILE_SECRET_KEY'), response: token }), signal: AbortSignal.timeout(10000),
  });
  const result = await response.json() as { success: boolean; hostname?: string; action?: string };
  if (!response.ok || !result.success || result.action !== action || result.hostname !== new URL(env('SITE_URL')).hostname) throw new ApiError(400, 'Verification expired or failed. Please verify again.');
}
type Payment = { id: string; order_id: string; amount: number; currency: string; status: string; amount_refunded?: number; method?: string };
async function gateway<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${env('RAZORPAY_KEY_ID')}:${env('RAZORPAY_KEY_SECRET')}`).toString('base64')}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new ApiError(502, 'Payment provider unavailable. Do not pay again if money was debited; contact our team with your payment reference.');
  return await response.json() as T;
}
const humanFields = { humanToken: z.string().max(2048).default(''), website: z.string().max(200).default('') };
const accessSchema = z.object({ id: z.string().uuid(), token: z.string().regex(/^[a-f0-9]{64}$/) });
type DonationRow = { id: string; token_hash: string; name: string; email: string; phone: string; amount_paise: number; order_id: string | null; payment_id: string | null; status: string; mode: string; created_at: string; amount_refunded: number };
async function donationFor(id: string, token: string) {
  const { data, error } = await database().from('donations').select('*').eq('id', id).eq('token_hash', hashToken(token)).maybeSingle();
  if (error) throw new ApiError(503, 'Payment records are temporarily unavailable. Please try again.');
  if (!data) throw new ApiError(404, 'Donation reference not found.');
  return data as DonationRow;
}
async function reconcile(row: DonationRow, payment: Payment) {
  if (payment.order_id !== row.order_id || payment.amount !== row.amount_paise || payment.currency !== 'INR') throw new ApiError(400, 'Payment details do not match this donation.');
  if (!['captured', 'refunded'].includes(payment.status)) return row;
  const { data, error } = await database().rpc('record_verified_payment', { donation_id: row.id, provider_payment_id: payment.id, refunded_paise: payment.amount_refunded || 0 });
  if (error) throw new ApiError(503, 'Payment received by provider; confirmation is pending. Please check again without paying twice.');
  return data as DonationRow;
}
function summary(row: DonationRow) {
  return { id: row.id, name: row.name, amount: row.amount_paise / 100, orderId: row.order_id, paymentId: row.payment_id, status: row.status, mode: row.mode, date: row.created_at, refunded: row.amount_refunded / 100 };
}
function requirePaymentMode(row: DonationRow) {
  if (!env('RAZORPAY_KEY_ID') || !env('RAZORPAY_KEY_SECRET')) throw new ApiError(503, 'Payment checks are temporarily unavailable. Keep your reference and contact our team before paying again.');
  if (!env('RAZORPAY_KEY_ID').startsWith(`rzp_${row.mode}_`)) throw new ApiError(409, 'This checkout belongs to a different payment environment. Contact our team with your reference.');
}

export async function handleApi(request: Request): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (!path.startsWith('/api/')) return null;
  try {
    if (path === '/api/health' && request.method === 'GET') return json({ status: 'ok' });
    if (path === '/api/config' && request.method === 'GET') return json({ paymentsMode: formsReady() ? mode() : 'disabled', turnstileSiteKey: env('TURNSTILE_SITE_KEY') || null, assistanceEnabled: formsReady() });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (path === '/api/payments/webhook') {
      if (!env('RAZORPAY_WEBHOOK_SECRET')) throw new ApiError(503, 'Webhook not configured');
      const raw = await limitedBody(request, 65536);
      if (!validSignature(raw, request.headers.get('x-razorpay-signature') || '', env('RAZORPAY_WEBHOOK_SECRET'))) throw new ApiError(401, 'Invalid signature');
      const event = z.object({ event: z.string(), payload: z.object({
        payment: z.object({ entity: z.object({ id: z.string() }) }).optional(),
        refund: z.object({ entity: z.object({ payment_id: z.string() }) }).optional(),
      }).optional() }).parse(JSON.parse(raw));
      if (!['payment.captured', 'order.paid', 'refund.processed'].includes(event.event)) return json({ received: true });
      const paymentId = event.payload?.payment?.entity?.id || event.payload?.refund?.entity?.payment_id;
      if (typeof paymentId !== 'string' || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) throw new ApiError(400, 'Invalid payment event');
      const payment = await gateway<Payment>(`payments/${paymentId}`);
      const { data, error } = await database().from('donations').select('*').eq('order_id', payment.order_id).maybeSingle();
      if (error) throw new ApiError(503, 'Retry event later');
      if (data) await reconcile(data as DonationRow, payment);
      // Unknown orders may originate in another integration on the same merchant account.
      return json({ received: true });
    }
    const origin = siteOrigin();
    if (!origin) throw new ApiError(503, 'Online forms are not configured yet. Please contact our team.');
    if (!sameOrigin(request, origin)) throw new ApiError(403, 'Request origin not allowed');
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ApiError(415, 'JSON required');
    const body: unknown = JSON.parse(await limitedBody(request));
    if (path === '/api/assistance') {
      const parsed = assistanceSchema.extend({ id: z.string().uuid(), consent: z.literal(true), ...humanFields }).parse(body);
      if (parsed.website) throw new ApiError(400, 'Unable to submit this request.');
      await checkHuman(parsed.humanToken, 'assistance');
      const { name, phone, village, assistance_type } = parsed;
      const payload = { name, phone: normalizeIndianPhone(phone), village, assistance_type };
      const matches = (saved: typeof payload) => saved.name === payload.name && normalizeIndianPhone(saved.phone) === payload.phone && saved.village === payload.village && saved.assistance_type === payload.assistance_type;
      const db = database();
      const existing = await db.from('assistance_requests').select('name,phone,village,assistance_type').eq('id', parsed.id).maybeSingle();
      if (existing.error) throw new ApiError(503, 'Requests are temporarily unavailable. Please call our helpline.');
      if (existing.data) {
        const saved = existing.data;
        if (!matches(saved)) throw new ApiError(409, 'Please start a new request.');
        return json({ id: parsed.id });
      }
      const permit = randomUUID();
      await db.from('submission_permits').delete().lt('expires_at', new Date().toISOString());
      const created = await db.from('submission_permits').insert({ id: permit, request_id: parsed.id, payload });
      if (created.error) throw new ApiError(503, 'Requests are temporarily unavailable. Please call our helpline.');
      // Use the public role: database INSERT-only RLS remains the final permission boundary.
      const { error } = await database(false).from('assistance_requests').insert({ ...payload, id: parsed.id, submission_token: permit });
      // Also remove permits after a rejected insert; the trigger consumes successful ones.
      await db.from('submission_permits').delete().eq('id', permit);
      if (error) {
        if (error.code === '23505') {
          const retry = await db.from('assistance_requests').select('name,phone,village,assistance_type').eq('id', parsed.id).maybeSingle();
          if (retry.error || !retry.data) throw new ApiError(503, 'Confirmation is pending. Retry with the same details.');
          if (!matches(retry.data)) throw new ApiError(409, 'Please start a new request.');
          return json({ id: parsed.id });
        }
        throw new ApiError(error.code === 'P0001' ? 429 : 503, 'Request could not be saved or too many requests were submitted. Please call +91 75688 96804.');
      }
      return json({ id: parsed.id }, 201);
    }
    if (path === '/api/payments/order') {
      if (mode() === 'disabled' || !formsReady()) throw new ApiError(503, 'Online donations are not enabled. Please contact our team.');
      const parsed = donorSchema.extend({ ...accessSchema.shape, ...humanFields, consent: z.literal(true) }).parse(body);
      if (parsed.website) throw new ApiError(400, 'Unable to submit this request.');
      await checkHuman(parsed.humanToken, 'donation');
      const db = database();
      const { data: existing, error: lookupError } = await db.from('donations').select('*').eq('id', parsed.id).maybeSingle();
      if (lookupError) throw new ApiError(503, 'Donation database unavailable. Please try later.');
      let row: DonationRow;
      if (existing) {
        row = await donationFor(parsed.id, parsed.token);
        requirePaymentMode(row);
        if (row.amount_paise !== parsed.amount * 100 || row.email !== parsed.email || row.name !== parsed.name || row.phone !== parsed.phone) throw new ApiError(409, 'A checkout already exists. Check its status before starting another donation.');
        if (!row.order_id) throw new ApiError(409, 'Order creation is pending. Contact our team with your reference; do not start another payment.');
      } else {
        const inserted = await db.from('donations').insert({ id: parsed.id, token_hash: hashToken(parsed.token), name: parsed.name, email: parsed.email, phone: parsed.phone, amount_paise: parsed.amount * 100, mode: mode() }).select('*').single();
        if (inserted.error) throw new ApiError(inserted.error.code === 'P0001' ? 429 : 409, 'Unable to start another checkout. Please check your existing donation or contact us.');
        row = inserted.data as DonationRow;
        const order = await gateway<{ id: string; amount: number; currency: string }>('orders', { amount: row.amount_paise, currency: 'INR', receipt: row.id, notes: { donation_id: row.id } });
        if (!/^order_[A-Za-z0-9]+$/.test(order.id) || order.amount !== row.amount_paise || order.currency !== 'INR') throw new ApiError(502, 'Invalid payment-provider response.');
        const updated = await db.from('donations').update({ order_id: order.id }).eq('id', row.id);
        if (updated.error) throw new ApiError(503, 'Order confirmation is pending. Please contact our team.');
        row.order_id = order.id;
      }
      return json({ id: row.id, orderId: row.order_id, amount: row.amount_paise, keyId: env('RAZORPAY_KEY_ID'), mode: row.mode, status: row.status });
    }
    if (path === '/api/payments/verify') {
      const parsed = accessSchema.extend({ paymentId: z.string().regex(/^pay_[A-Za-z0-9]+$/), signature: z.string().length(64) }).parse(body);
      const row = await donationFor(parsed.id, parsed.token);
      requirePaymentMode(row);
      if (!row.order_id || !validSignature(`${row.order_id}|${parsed.paymentId}`, parsed.signature, env('RAZORPAY_KEY_SECRET'))) throw new ApiError(400, 'Payment verification failed. Contact our team if money was debited.');
      return json(summary(await reconcile(row, await gateway<Payment>(`payments/${parsed.paymentId}`))));
    }
    if (path === '/api/payments/status') {
      const parsed = accessSchema.parse(body);
      let row = await donationFor(parsed.id, parsed.token);
      requirePaymentMode(row);
      let awaitingCapture = false;
      if (row.order_id) {
        const payments = await gateway<{ items: Payment[] }>(`orders/${row.order_id}/payments`);
        const paid = payments.items.find(p => ['captured', 'refunded'].includes(p.status));
        if (paid) row = await reconcile(row, paid);
        awaitingCapture = row.status === 'pending' && payments.items.some(p => p.status === 'authorized');
      }
      // Recover an order even when its original response never reached the browser.
      // Never invite another payment while an existing attempt awaits capture.
      const checkout = row.order_id && row.status === 'pending' && !awaitingCapture && formsReady() && mode() === row.mode
        ? { orderId: row.order_id, keyId: env('RAZORPAY_KEY_ID'), amount: row.amount_paise, mode: row.mode }
        : null;
      return json({ ...summary(row), checkout, awaitingCapture });
    }
    return json({ error: 'Not found' }, 404);
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.message }, error.status);
    if (error instanceof z.ZodError) return json({ error: error.issues[0]?.message || 'Invalid details' }, 400);
    if (error instanceof SyntaxError) return json({ error: 'Invalid JSON' }, 400);
    if (error instanceof Error && error.message === 'BODY_TOO_LARGE') return json({ error: 'Request too large' }, 413);
    console.error('API request failed', { path, kind: error instanceof Error ? error.name : 'UnknownError' });
    return json({ error: 'Service temporarily unavailable. Please try again or call +91 75688 96804.' }, 503);
  }
}
