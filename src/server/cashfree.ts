import { z } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const env = (key: string) => process.env[key] || "";
export const gatewayMode = () =>
  env("CASHFREE_ENV") === "sandbox" ? "test" : env("CASHFREE_ENV") === "production" ? "live" : null;
export const gatewayReady = () =>
  !!(gatewayMode() && env("CASHFREE_APP_ID") && env("CASHFREE_SECRET_KEY"));
export const orderIdFor = (id: string) => `thd_${id.replaceAll("-", "")}`;
export const orderSchema = z.object({
  order_id: z.string(),
  order_amount: z.number(),
  order_currency: z.string(),
  order_status: z.string(),
  payment_session_id: z.string().optional(),
});
export type CashfreeOrder = z.infer<typeof orderSchema>;
const providerId = z.union([z.string().min(1), z.number().int().nonnegative()]).transform(String);
export const paymentsSchema = z.array(
  z.object({
    cf_payment_id: providerId,
    order_id: z.string(),
    payment_amount: z.number(),
    payment_currency: z.string(),
    payment_status: z.string(),
    payment_time: z.string().datetime({ offset: true }).nullish(),
    payment_completion_time: z.string().datetime({ offset: true }).nullish(),
    payment_group: z.string().max(80).nullish(),
    bank_reference: z
      .union([z.string().max(200), z.number()])
      .nullish()
      .transform((value) => (value == null ? null : String(value))),
    is_captured: z.boolean().optional(),
    authorization: z
      .object({ action: z.string(), status: z.string(), captured_amount: z.number().optional() })
      .nullish(),
  }),
);
export const refundsSchema = z.array(
  z.object({
    cf_refund_id: providerId,
    cf_payment_id: providerId,
    order_id: z.string(),
    refund_amount: z.number(),
    refund_currency: z.string(),
    refund_status: z.string(),
  }),
);
export type CashfreePayment = z.infer<typeof paymentsSchema>[number];
export function isPaid(payment: CashfreePayment) {
  return (
    payment.payment_status === "SUCCESS" &&
    payment.is_captured !== false &&
    (!payment.authorization ||
      (payment.authorization.action === "CAPTURE" &&
        payment.authorization.status === "SUCCESS" &&
        payment.authorization.captured_amount === payment.payment_amount))
  );
}
export async function gateway(
  path: string,
  body?: unknown,
  idempotencyKey?: string,
  allowMissing = false,
): Promise<unknown> {
  if (!gatewayReady())
    throw new ApiError(
      503,
      "Payment checks are temporarily unavailable. Keep your reference and contact our team before paying again.",
    );
  const base =
    gatewayMode() === "test" ? "https://sandbox.cashfree.com/pg" : "https://api.cashfree.com/pg";
  const response = await fetch(`${base}/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "x-client-id": env("CASHFREE_APP_ID"),
      "x-client-secret": env("CASHFREE_SECRET_KEY"),
      "x-api-version": "2026-01-01",
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(12000),
  });
  if (allowMissing && response.status === 404) return null;
  if (!response.ok)
    throw new ApiError(
      502,
      "Payment provider unavailable. Do not pay again if money was debited; check the existing checkout or contact our team with your reference.",
    );
  return response.json();
}
export function parseProvider<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    throw new ApiError(
      502,
      "Payment provider returned an unexpected response. Keep your reference and check again.",
    );
  return parsed.data;
}
