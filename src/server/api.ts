import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { assistanceSchema, donorSchema, normalizeIndianPhone } from "../lib/ngo";
import { hashToken, limitedBody, sameOrigin, validCashfreeSignature } from "./security";
import { supabaseFetch } from "./supabase-fetch";

import {
  ApiError,
  gateway,
  gatewayMode,
  gatewayReady,
  orderIdFor,
  orderSchema,
  paymentsSchema,
  refundsSchema,
  isPaid,
  parseProvider,
  type CashfreeOrder,
} from "./cashfree";
const env = (key: string) => process.env[key] || "";
const secretKey = () => env("SUPABASE_SECRET_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");
function siteOrigin() {
  try {
    const url = new URL(env("SITE_URL"));
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    if (env("NODE_ENV") === "production" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}
const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
function database(admin = true) {
  const key = admin ? secretKey() : env("SUPABASE_PUBLISHABLE_KEY");
  if (!env("SUPABASE_URL") || !key)
    throw new ApiError(
      503,
      "Online requests are temporarily unavailable. Please call +91 75689 68704.",
    );
  return createClient(env("SUPABASE_URL"), key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: supabaseFetch(key) },
  });
}
function mode(): "disabled" | "test" | "live" {
  const value = env("PAYMENTS_MODE");
  if (
    (value === "test" || value === "live") &&
    gatewayReady() &&
    gatewayMode() === value &&
    secretKey() &&
    env("SUPABASE_URL")
  )
    return value;
  return "disabled";
}
function formsReady() {
  return !!(
    siteOrigin() &&
    env("SUPABASE_URL") &&
    secretKey() &&
    env("SUPABASE_PUBLISHABLE_KEY") &&
    (env("NODE_ENV") !== "production" || (env("TURNSTILE_SECRET_KEY") && env("TURNSTILE_SITE_KEY")))
  );
}
async function checkHuman(token: string, action: string) {
  if (!env("TURNSTILE_SECRET_KEY")) {
    if (env("NODE_ENV") === "production")
      throw new ApiError(503, "Online forms are not configured yet. Please contact our team.");
    return;
  }
  if (!token) throw new ApiError(400, "Please complete the verification before submitting.");
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: env("TURNSTILE_SECRET_KEY"), response: token }),
    signal: AbortSignal.timeout(10000),
  });
  const result = (await response.json()) as {
    success: boolean;
    hostname?: string;
    action?: string;
  };
  if (
    !response.ok ||
    !result.success ||
    result.action !== action ||
    result.hostname !== new URL(env("SITE_URL")).hostname
  )
    throw new ApiError(400, "Verification expired or failed. Please verify again.");
}
const humanFields = {
  humanToken: z.string().max(2048).default(""),
  website: z.string().max(200).default(""),
};
const accessSchema = z.object({ id: z.string().uuid(), token: z.string().regex(/^[a-f0-9]{64}$/) });
type DonationRow = {
  id: string;
  token_hash: string;
  name: string;
  email: string;
  phone: string;
  amount_paise: number;
  order_id: string | null;
  payment_id: string | null;
  status: string;
  mode: string;
  created_at: string;
  amount_refunded: number;
  provider: string;
};
async function donationFor(id: string, token: string) {
  const { data, error } = await database()
    .from("donations")
    .select("*")
    .eq("id", id)
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (error)
    throw new ApiError(503, "Payment records are temporarily unavailable. Please try again.");
  if (!data) throw new ApiError(404, "Donation reference not found.");
  return data as DonationRow;
}
function validateOrder(row: DonationRow, order: CashfreeOrder) {
  if (
    order.order_id !== row.order_id ||
    Math.round(order.order_amount * 100) !== row.amount_paise ||
    order.order_currency !== "INR"
  )
    throw new ApiError(400, "Payment details do not match this donation.");
}
async function readOrder(row: DonationRow) {
  if (!row.order_id) return null;
  const data = await gateway(
    `orders/${encodeURIComponent(row.order_id)}`,
    undefined,
    undefined,
    true,
  );
  if (!data) return null;
  const order = parseProvider(orderSchema, data);
  validateOrder(row, order);
  return order;
}
async function ensureOrder(row: DonationRow) {
  if (!row.order_id)
    throw new ApiError(409, "Order reference missing. Contact our team before paying again.");
  let order = await readOrder(row);
  if (!order) {
    order = parseProvider(
      orderSchema,
      await gateway(
        "orders",
        {
          order_id: row.order_id,
          order_amount: row.amount_paise / 100,
          order_currency: "INR",
          customer_details: {
            customer_id: row.id,
            customer_name: row.name,
            customer_email: row.email,
            customer_phone: normalizeIndianPhone(row.phone),
          },
          order_meta: { return_url: `${siteOrigin()}/#donate` },
          order_note: `Donation ${row.id}`,
        },
        row.id,
      ),
    );
    validateOrder(row, order);
  }
  return order;
}
async function paymentState(row: DonationRow, order: CashfreeOrder) {
  validateOrder(row, order);
  const payments = parseProvider(
    paymentsSchema,
    await gateway(`orders/${encodeURIComponent(order.order_id)}/payments`),
  );
  const paid = payments.find(
    (p) => isPaid(p) && (!row.payment_id || p.cf_payment_id === row.payment_id),
  );
  if (paid) {
    if (
      paid.order_id !== row.order_id ||
      Math.round(paid.payment_amount * 100) !== row.amount_paise ||
      paid.payment_currency !== "INR" ||
      order.order_status !== "PAID"
    )
      throw new ApiError(400, "Payment details do not match this donation.");
    const refunds = parseProvider(
      refundsSchema,
      await gateway(`orders/${encodeURIComponent(order.order_id)}/refunds`),
    );
    const seen = new Set<string>();
    let refunded = 0;
    for (const refund of refunds) {
      if (
        refund.refund_status !== "SUCCESS" ||
        refund.cf_payment_id !== paid.cf_payment_id ||
        seen.has(refund.cf_refund_id)
      )
        continue;
      if (
        refund.order_id !== row.order_id ||
        refund.refund_currency !== "INR" ||
        refund.refund_amount < 0
      )
        throw new ApiError(400, "Refund details do not match this donation.");
      seen.add(refund.cf_refund_id);
      refunded += Math.round(refund.refund_amount * 100);
    }
    if (refunded > row.amount_paise)
      throw new ApiError(400, "Refund details do not match this donation.");
    const { data, error } = await database().rpc("record_verified_payment", {
      donation_id: row.id,
      provider_payment_id: paid.cf_payment_id,
      refunded_paise: refunded,
    });
    if (error)
      throw new ApiError(
        503,
        "Payment received by provider; confirmation is pending. Please check again without paying twice.",
      );
    row = data as DonationRow;
  }
  const awaitingCapture =
    row.status === "pending" &&
    (order.order_status === "PAID" ||
      payments.some(
        (p) => p.payment_status === "PENDING" || (p.payment_status === "SUCCESS" && !isPaid(p)),
      ));
  const checkout =
    row.status === "pending" &&
    !awaitingCapture &&
    order.order_status === "ACTIVE" &&
    order.payment_session_id &&
    formsReady() &&
    mode() === row.mode
      ? {
          orderId: row.order_id,
          paymentSessionId: order.payment_session_id,
          amount: row.amount_paise,
          mode: row.mode,
        }
      : null;
  return { ...summary(row), checkout, awaitingCapture, orderStatus: order.order_status };
}
function summary(row: DonationRow) {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount_paise / 100,
    orderId: row.order_id,
    paymentId: row.payment_id,
    status: row.status,
    mode: row.mode,
    date: row.created_at,
    refunded: row.amount_refunded / 100,
  };
}
function requirePaymentMode(row: DonationRow) {
  if (row.provider !== "cashfree")
    throw new ApiError(
      409,
      "This reference belongs to the previous payment provider. Contact our team for reconciliation; do not pay again.",
    );
  if (!gatewayReady())
    throw new ApiError(
      503,
      "Payment checks are temporarily unavailable. Keep your reference and contact our team before paying again.",
    );
  if (gatewayMode() !== row.mode)
    throw new ApiError(
      409,
      "This checkout belongs to a different payment environment. Contact our team with your reference.",
    );
}

export async function handleApi(request: Request): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (!path.startsWith("/api/")) return null;
  try {
    if (path === "/api/health" && request.method === "GET") return json({ status: "ok" });
    if (path === "/api/config" && request.method === "GET")
      return json({
        paymentsMode: formsReady() ? mode() : "disabled",
        turnstileSiteKey: env("TURNSTILE_SITE_KEY") || null,
        assistanceEnabled: formsReady(),
      });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (path === "/api/payments/webhook") {
      if (!gatewayReady()) throw new ApiError(503, "Webhook not configured");
      const raw = await limitedBody(request, 65536);
      if (
        !validCashfreeSignature(
          raw,
          request.headers.get("x-webhook-timestamp") || "",
          request.headers.get("x-webhook-signature") || "",
          env("CASHFREE_SECRET_KEY"),
        )
      )
        throw new ApiError(401, "Invalid signature");
      const event = z
        .object({
          type: z.string(),
          data: z
            .object({
              order: z.object({ order_id: z.string() }).optional(),
              refund: z.object({ order_id: z.string() }).optional(),
              auto_refund: z.object({ order_id: z.string().optional() }).optional(),
            })
            .optional(),
        })
        .parse(JSON.parse(raw));
      if (
        ![
          "PAYMENT_SUCCESS_WEBHOOK",
          "PAYMENT_FAILED_WEBHOOK",
          "PAYMENT_USER_DROPPED_WEBHOOK",
          "REFUND_STATUS_WEBHOOK",
          "AUTO_REFUND_STATUS_WEBHOOK",
        ].includes(event.type)
      )
        return json({ received: true });
      const orderId =
        event.data?.order?.order_id ||
        event.data?.refund?.order_id ||
        event.data?.auto_refund?.order_id;
      if (!orderId && event.type === "AUTO_REFUND_STATUS_WEBHOOK") return json({ received: true });
      if (!orderId || !/^[A-Za-z0-9_-]{1,45}$/.test(orderId))
        throw new ApiError(400, "Invalid payment event");
      const { data, error } = await database()
        .from("donations")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();
      if (error) throw new ApiError(503, "Retry event later");
      if (data) {
        const row = data as DonationRow;
        requirePaymentMode(row);
        const order = await readOrder(row);
        if (!order) throw new ApiError(503, "Order confirmation pending; retry event later");
        await paymentState(row, order);
      }
      return json({ received: true });
    }
    const origin = siteOrigin();
    if (!origin)
      throw new ApiError(503, "Online forms are not configured yet. Please contact our team.");
    if (!sameOrigin(request, origin)) throw new ApiError(403, "Request origin not allowed");
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new ApiError(415, "JSON required");
    const body: unknown = JSON.parse(await limitedBody(request));
    if (path === "/api/assistance") {
      const parsed = assistanceSchema
        .extend({ id: z.string().uuid(), consent: z.literal(true), ...humanFields })
        .parse(body);
      if (parsed.website) throw new ApiError(400, "Unable to submit this request.");
      await checkHuman(parsed.humanToken, "assistance");
      const { name, phone, village, assistance_type } = parsed;
      const payload = { name, phone: normalizeIndianPhone(phone), village, assistance_type };
      const matches = (saved: typeof payload) =>
        saved.name === payload.name &&
        normalizeIndianPhone(saved.phone) === payload.phone &&
        saved.village === payload.village &&
        saved.assistance_type === payload.assistance_type;
      const db = database();
      const existing = await db
        .from("assistance_requests")
        .select("name,phone,village,assistance_type")
        .eq("id", parsed.id)
        .maybeSingle();
      if (existing.error)
        throw new ApiError(503, "Requests are temporarily unavailable. Please call our helpline.");
      if (existing.data) {
        const saved = existing.data;
        if (!matches(saved)) throw new ApiError(409, "Please start a new request.");
        return json({ id: parsed.id });
      }
      const permit = randomUUID();
      await db.from("submission_permits").delete().lt("expires_at", new Date().toISOString());
      const created = await db
        .from("submission_permits")
        .insert({ id: permit, request_id: parsed.id, payload });
      if (created.error)
        throw new ApiError(503, "Requests are temporarily unavailable. Please call our helpline.");
      // Use the public role: database INSERT-only RLS remains the final permission boundary.
      const { error } = await database(false)
        .from("assistance_requests")
        .insert({ ...payload, id: parsed.id, submission_token: permit });
      // Also remove permits after a rejected insert; the trigger consumes successful ones.
      await db.from("submission_permits").delete().eq("id", permit);
      if (error) {
        if (error.code === "23505") {
          const retry = await db
            .from("assistance_requests")
            .select("name,phone,village,assistance_type")
            .eq("id", parsed.id)
            .maybeSingle();
          if (retry.error || !retry.data)
            throw new ApiError(503, "Confirmation is pending. Retry with the same details.");
          if (!matches(retry.data)) throw new ApiError(409, "Please start a new request.");
          return json({ id: parsed.id });
        }
        throw new ApiError(
          error.code === "P0001" ? 429 : 503,
          "Request could not be saved or too many requests were submitted. Please call +91 75689 68704.",
        );
      }
      return json({ id: parsed.id }, 201);
    }
    if (path === "/api/payments/order") {
      if (mode() === "disabled" || !formsReady())
        throw new ApiError(503, "Online donations are not enabled. Please contact our team.");
      const parsed = donorSchema
        .extend({ ...accessSchema.shape, ...humanFields, consent: z.literal(true) })
        .parse(body);
      if (parsed.website) throw new ApiError(400, "Unable to submit this request.");
      await checkHuman(parsed.humanToken, "donation");
      const db = database();
      const { data: existing, error: lookupError } = await db
        .from("donations")
        .select("*")
        .eq("id", parsed.id)
        .maybeSingle();
      if (lookupError) throw new ApiError(503, "Donation database unavailable. Please try later.");
      let row: DonationRow;
      if (existing) {
        row = await donationFor(parsed.id, parsed.token);
        requirePaymentMode(row);
        if (
          row.amount_paise !== parsed.amount * 100 ||
          row.email !== parsed.email ||
          row.name !== parsed.name ||
          normalizeIndianPhone(row.phone) !== normalizeIndianPhone(parsed.phone)
        )
          throw new ApiError(
            409,
            "A checkout already exists. Check its status before starting another donation.",
          );
        if (!row.order_id)
          throw new ApiError(409, "Order reference missing. Contact our team before paying again.");
      } else {
        const inserted = await db
          .from("donations")
          .insert({
            id: parsed.id,
            token_hash: hashToken(parsed.token),
            name: parsed.name,
            email: parsed.email,
            phone: normalizeIndianPhone(parsed.phone),
            amount_paise: parsed.amount * 100,
            mode: mode(),
            provider: "cashfree",
            order_id: orderIdFor(parsed.id),
          })
          .select("*")
          .single();
        if (inserted.error)
          throw new ApiError(
            inserted.error.code === "P0001" ? 429 : 409,
            "Unable to start another checkout. Please check your existing donation or contact us.",
          );
        row = inserted.data as DonationRow;
      }
      // Persist a deterministic ID BEFORE contacting Cashfree. Retries reuse the same order and UUID idempotency key.
      const order = await ensureOrder(row);
      const state = await paymentState(row, order);
      if (!state.checkout)
        throw new ApiError(
          409,
          "This order cannot be reopened. Check its payment status before starting another donation.",
        );
      return json({ id: row.id, ...state.checkout, status: state.status });
    }
    if (path === "/api/payments/resume") {
      const parsed = accessSchema.extend({ humanToken: humanFields.humanToken }).parse(body);
      const row = await donationFor(parsed.id, parsed.token);
      requirePaymentMode(row);
      if (!formsReady() || mode() !== row.mode)
        throw new ApiError(503, "New checkout attempts are paused.");
      await checkHuman(parsed.humanToken, "donation");
      return json(await paymentState(row, await ensureOrder(row)));
    }
    if (path === "/api/payments/verify" || path === "/api/payments/status") {
      const parsed = accessSchema.parse(body);
      const row = await donationFor(parsed.id, parsed.token);
      requirePaymentMode(row);
      const order = await readOrder(row);
      // A missing provider order is safe to retry with its original ID; never mint a new order here.
      if (!order)
        return json({
          ...summary(row),
          checkout: null,
          awaitingCapture: false,
          orderStatus: "NOT_CREATED",
          retryOrder: formsReady() && mode() === row.mode,
        });
      return json(await paymentState(row, order));
    }
    return json({ error: "Not found" }, 404);
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.message }, error.status);
    if (error instanceof z.ZodError)
      return json({ error: error.issues[0]?.message || "Invalid details" }, 400);
    if (error instanceof SyntaxError) return json({ error: "Invalid JSON" }, 400);
    if (error instanceof Error && error.message === "BODY_TOO_LARGE")
      return json({ error: "Request too large" }, 413);
    console.error("API request failed", {
      path,
      kind: error instanceof Error ? error.name : "UnknownError",
    });
    return json(
      { error: "Service temporarily unavailable. Please try again or call +91 75689 68704." },
      503,
    );
  }
}
