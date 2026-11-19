// @vitest-environment node
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ lookup: vi.fn(), rpc: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.lookup }) }) }),
    rpc: mocks.rpc,
  }),
}));
import { handleApi } from "../server/api";
const secret = "test-secret";
const timestamp = "1794740000000";
const row = {
  id: "11111111-1111-4111-8111-111111111111",
  order_id: "thd_test",
  amount_paise: 50000,
  mode: "test",
  provider: "cashfree",
};
const order = {
  order_id: "thd_test",
  order_amount: 500,
  order_currency: "INR",
  order_status: "PAID",
};
const payment = {
  cf_payment_id: "123",
  order_id: "thd_test",
  payment_amount: 500,
  payment_currency: "INR",
  payment_status: "SUCCESS",
};
const event = { type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: "thd_test" } } };
function request(value: unknown, tamper = false) {
  const raw = JSON.stringify(value);
  return new Request("https://ngo.example/api/payments/webhook", {
    method: "POST",
    headers: {
      "x-webhook-timestamp": timestamp,
      "x-webhook-signature": createHmac("sha256", secret)
        .update(timestamp + raw)
        .digest("base64"),
    },
    body: tamper ? raw + " " : raw,
  });
}
beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://db.example");
  vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_example");
  vi.stubEnv("CASHFREE_APP_ID", "app");
  vi.stubEnv("CASHFREE_SECRET_KEY", secret);
  vi.stubEnv("CASHFREE_ENV", "sandbox");
  mocks.lookup.mockReset().mockResolvedValue({ data: row, error: null });
  mocks.rpc.mockReset().mockResolvedValue({ data: row, error: null });
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(async (url: string) =>
        Response.json(
          url.endsWith("/payments") ? [payment] : url.endsWith("/refunds") ? [] : order,
        ),
      ),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Cashfree signed webhooks", () => {
  it("verifies the raw signature and provider state without requiring browser origin", async () => {
    expect((await handleApi(request(event)))?.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("record_verified_payment", {
      donation_id: row.id,
      provider_payment_id: "123",
      refunded_paise: 0,
    });
  });
  it("rejects equivalent JSON with altered raw bytes", async () => {
    expect((await handleApi(request(event, true)))?.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("accepts delayed signed retries and rechecks current provider state", async () => {
    expect((await handleApi(request(event)))?.status).toBe(200);
    expect((await handleApi(request(event)))?.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
  });
  it("handles refund-only events using provider refund totals", async () => {
    vi.mocked(fetch).mockImplementation(async (input) =>
      Response.json(
        String(input).endsWith("/payments")
          ? [payment]
          : String(input).endsWith("/refunds")
            ? [
                {
                  cf_refund_id: "r1",
                  cf_payment_id: "123",
                  order_id: "thd_test",
                  refund_amount: 500,
                  refund_currency: "INR",
                  refund_status: "SUCCESS",
                },
              ]
            : order,
      ),
    );
    expect(
      (
        await handleApi(
          request({ type: "REFUND_STATUS_WEBHOOK", data: { refund: { order_id: "thd_test" } } }),
        )
      )?.status,
    ).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("record_verified_payment", {
      donation_id: row.id,
      provider_payment_id: "123",
      refunded_paise: 50000,
    });
  });
  it.each([null, {}, { type: "PAYMENT_SUCCESS_WEBHOOK", data: {} }])(
    "rejects malformed events %j",
    async (value) => {
      expect((await handleApi(request(value)))?.status).toBe(400);
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it("reconciles auto-refund events with an order and safely ignores those without one", async () => {
    expect(
      (
        await handleApi(
          request({
            type: "AUTO_REFUND_STATUS_WEBHOOK",
            data: { auto_refund: { order_id: "thd_test" } },
          }),
        )
      )?.status,
    ).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(
      (await handleApi(request({ type: "AUTO_REFUND_STATUS_WEBHOOK", data: { auto_refund: {} } })))
        ?.status,
    ).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it("ignores unrelated events", async () => {
    expect((await handleApi(request({ type: "OTHER" })))?.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("ignores unknown orders from another integration", async () => {
    mocks.lookup.mockResolvedValue({ data: null, error: null });
    expect((await handleApi(request(event)))?.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("requests retry when database lookup fails", async () => {
    mocks.lookup.mockResolvedValue({ data: null, error: {} });
    expect((await handleApi(request(event)))?.status).toBe(503);
  });
  it("requests retry when provider lookup fails", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({}, { status: 503 }));
    expect((await handleApi(request(event)))?.status).toBe(502);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
