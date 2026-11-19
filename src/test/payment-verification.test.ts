// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  row: {} as Record<string, unknown>,
  rpc: vi.fn(),
  insert: vi.fn(),
  receipt: vi.fn(() => new TextEncoder().encode("%PDF-1.3 test").buffer),
}));
vi.mock("../server/receipt", () => ({ generateReceipt: mocks.receipt }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => {
      const query = {
        eq: () => query,
        maybeSingle: async () => ({ data: mocks.row, error: null }),
      };
      return { select: () => query, insert: mocks.insert };
    },
    rpc: mocks.rpc,
  }),
}));
import { handleApi } from "../server/api";
const id = "11111111-1111-4111-8111-111111111111";
const token = "a".repeat(64);
const order = {
  order_id: "thd_test",
  order_amount: 1000,
  order_currency: "INR",
  order_status: "ACTIVE",
  payment_session_id: "session_test",
};
const payment = {
  cf_payment_id: "12345",
  order_id: order.order_id,
  payment_amount: 1000,
  payment_currency: "INR",
  payment_status: "SUCCESS",
};
function request(path = "status", extra = {}) {
  return new Request(`https://ngo.example/api/payments/${path}`, {
    method: "POST",
    headers: { origin: "https://ngo.example", "Content-Type": "application/json" },
    body: JSON.stringify({ id, token, ...extra }),
  });
}
function provider(payments: unknown[] = [], changes = {}, refunds: unknown[] = []) {
  const mock = vi
    .fn()
    .mockImplementation(async (url: string) =>
      Response.json(
        url.endsWith("/payments")
          ? payments
          : url.endsWith("/refunds")
            ? refunds
            : { ...order, ...changes },
      ),
    );
  vi.stubGlobal("fetch", mock);
  return mock;
}
beforeEach(() => {
  mocks.receipt.mockClear();
  vi.stubEnv("SITE_URL", "https://ngo.example");
  vi.stubEnv("SUPABASE_URL", "https://db.example");
  vi.stubEnv("SUPABASE_SECRET_KEY", "server-only");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "public-key");
  vi.stubEnv("CASHFREE_APP_ID", "app_test");
  vi.stubEnv("CASHFREE_SECRET_KEY", "private-secret");
  vi.stubEnv("CASHFREE_ENV", "sandbox");
  vi.stubEnv("PAYMENTS_MODE", "test");
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  mocks.row = {
    id,
    order_id: order.order_id,
    amount_paise: 100000,
    name: "Test Donor",
    email: "test@example.org",
    phone: "9876543210",
    status: "pending",
    mode: "test",
    provider: "cashfree",
    created_at: "2026-11-15T00:00:00Z",
    payment_id: null,
    amount_refunded: 0,
  };
  mocks.rpc.mockReset().mockImplementation(async (_name, args) => ({
    data: {
      ...mocks.row,
      status: args.refunded_paise ? "partially_refunded" : "captured",
      payment_id: args.provider_payment_id,
      amount_refunded: args.refunded_paise,
    },
    error: null,
  }));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("Cashfree verification and recovery", () => {
  it("creates a receipt from verified records and ignores forged donor and amount fields", async () => {
    mocks.row["mode"] = "live";
    vi.stubEnv("CASHFREE_ENV", "production");
    provider(
      [
        {
          ...payment,
          payment_time: "2026-11-19T10:02:00+05:30",
          payment_group: "upi",
          bank_reference: "bank_123",
        },
      ],
      { order_status: "PAID" },
    );
    const response = await handleApi(request("receipt", { name: "Forged", amount: 999999 }));
    expect(response?.status).toBe(200);
    expect(response?.headers.get("content-type")).toBe("application/pdf");
    expect(response?.headers.get("cache-control")).toBe("no-store");
    expect(mocks.receipt).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Donor",
        email: "test@example.org",
        phone: "9876543210",
        amount: 1000,
        paymentId: "12345",
        status: "captured",
        mode: "live",
        bankReference: "bank_123",
        paymentDate: "2026-11-19T10:02:00+05:30",
      }),
    );
  });
  it.each(["PENDING", "FAILED"])(
    "withholds receipts for %s payments despite a browser success claim",
    async (status) => {
      provider([{ ...payment, payment_status: status }]);
      expect((await handleApi(request("receipt", { status: "captured" })))?.status).toBe(409);
      expect(mocks.receipt).not.toHaveBeenCalled();
    },
  );
  it("withholds receipts without the donation secret or when provider amounts differ", async () => {
    expect((await handleApi(request("receipt", { token: "" })))?.status).toBe(400);
    provider([{ ...payment, payment_amount: 1 }], { order_status: "PAID" });
    expect((await handleApi(request("receipt")))?.status).toBe(400);
    expect(mocks.receipt).not.toHaveBeenCalled();
  });
  it("refreshes refund totals before issuing the receipt", async () => {
    provider([payment], { order_status: "PAID" }, [
      {
        cf_refund_id: "refund_1",
        cf_payment_id: "12345",
        order_id: order.order_id,
        refund_amount: 100,
        refund_currency: "INR",
        refund_status: "SUCCESS",
      },
    ]);
    expect((await handleApi(request("receipt")))?.status).toBe(200);
    expect(mocks.receipt).toHaveBeenCalledWith(
      expect.objectContaining({ refunded: 100, status: "partially_refunded" }),
    );
  });
  it("saves the deterministic reference before a timed-out provider call", async () => {
    mocks.row = null as unknown as Record<string, unknown>;
    mocks.insert.mockImplementation((value) => {
      mocks.row = { ...value, status: "pending", amount_refunded: 0 };
      return { select: () => ({ single: async () => ({ data: mocks.row, error: null }) }) };
    });
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json({}, { status: 404 }))
      .mockRejectedValueOnce(new Error("timeout"));
    vi.stubGlobal("fetch", fetcher);
    const response = await handleApi(
      request("order", {
        name: "Test Donor",
        email: "test@example.org",
        phone: "+91 9876543210",
        amount: 1000,
        consent: true,
      }),
    );
    expect(response?.status).toBe(503);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "cashfree",
        order_id: "thd_11111111111141118111111111111111",
        phone: "9876543210",
        amount_paise: 100000,
      }),
    );
    expect(mocks.insert.mock.invocationCallOrder[0]).toBeLessThan(
      fetcher.mock.invocationCallOrder[0]!,
    );
    expect(mocks.row["order_id"]).toBe("thd_11111111111141118111111111111111");
  });
  it("recovers only the existing session and never exposes private keys", async () => {
    const fetcher = provider();
    const result = await (await handleApi(request()))?.json();
    expect(result.checkout).toEqual({
      orderId: order.order_id,
      paymentSessionId: "session_test",
      amount: 100000,
      mode: "test",
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.every((call) => call[1].method === "GET")).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/private-secret|token_hash|email/);
  });
  it.each(["PENDING", "SUCCESS"])(
    "blocks retry while %s is unconfirmed",
    async (payment_status) => {
      provider([{ ...payment, payment_status, is_captured: false }]);
      const result = await (await handleApi(request()))?.json();
      expect(result.awaitingCapture).toBe(true);
      expect(result.checkout).toBeNull();
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it("does not acknowledge preauthorised-only payments", async () => {
    provider(
      [
        {
          ...payment,
          authorization: { action: "CAPTURE", status: "PENDING", captured_amount: 1000 },
        },
      ],
      { order_status: "PAID" },
    );
    expect((await (await handleApi(request()))?.json()).status).toBe("pending");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(["EXPIRED", "TERMINATED"])("does not reopen %s orders", async (order_status) => {
    provider([], { order_status });
    expect((await (await handleApi(request()))?.json()).checkout).toBeNull();
  });
  it("does not reopen previously recorded donations", async () => {
    mocks.row["status"] = "captured";
    provider();
    expect((await (await handleApi(request()))?.json()).checkout).toBeNull();
  });
  it("does not create a missing order on a status check", async () => {
    const mock = vi.fn().mockResolvedValue(Response.json({}, { status: 404 }));
    vi.stubGlobal("fetch", mock);
    const result = await (await handleApi(request()))?.json();
    expect(result.retryOrder).toBe(true);
    expect(result.checkout).toBeNull();
    expect(mock).toHaveBeenCalledTimes(1);
  });
  it("explicit recovery reuses the stored order and idempotency key", async () => {
    const mock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({}, { status: 404 }))
      .mockResolvedValueOnce(Response.json(order))
      .mockResolvedValueOnce(Response.json([]));
    vi.stubGlobal("fetch", mock);
    expect((await handleApi(request("resume")))?.status).toBe(200);
    expect(mock.mock.calls[1]![0]).toBe("https://sandbox.cashfree.com/pg/orders");
    const init = mock.mock.calls[1]![1];
    expect(init.headers["x-idempotency-key"]).toBe(id);
    expect(init.headers["x-api-version"]).toBe("2026-01-01");
    expect(JSON.parse(init.body)).toMatchObject({
      order_id: order.order_id,
      order_amount: 1000,
      order_meta: { return_url: "https://ngo.example/#donate" },
    });
  });
  it("rejects environment switches and legacy references", async () => {
    const mock = provider();
    vi.stubEnv("CASHFREE_ENV", "production");
    expect((await handleApi(request()))?.status).toBe(409);
    vi.stubEnv("CASHFREE_ENV", "sandbox");
    mocks.row["provider"] = "razorpay";
    expect((await handleApi(request()))?.status).toBe(409);
    expect(mock).not.toHaveBeenCalled();
  });
  it("pausing donations retains status checks but disables resume", async () => {
    vi.stubEnv("PAYMENTS_MODE", "disabled");
    provider();
    expect((await (await handleApi(request()))?.json()).checkout).toBeNull();
    expect((await handleApi(request("resume")))?.status).toBe(503);
  });
  it("fails closed without credentials", async () => {
    vi.stubEnv("CASHFREE_SECRET_KEY", "");
    const mock = provider();
    expect((await handleApi(request()))?.status).toBe(503);
    expect(mock).not.toHaveBeenCalled();
  });
  it.each([{ payment_amount: 1 }, { payment_currency: "USD" }, { order_id: "other" }])(
    "rejects mismatched payment %j",
    async (changes) => {
      provider([{ ...payment, ...changes }], { order_status: "PAID" });
      expect((await handleApi(request("verify")))?.status).toBe(400);
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it.each([{ order_amount: 1 }, { order_currency: "USD" }, { order_id: "other" }])(
    "rejects mismatched order %j",
    async (changes) => {
      provider([], changes);
      expect((await handleApi(request()))?.status).toBe(400);
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it("ignores forged browser success and uses provider state", async () => {
    provider([{ ...payment, payment_status: "FAILED" }]);
    expect((await (await handleApi(request("verify", { status: "SUCCESS" })))?.json()).status).toBe(
      "pending",
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("records a matching paid order, summing only unique successful refunds", async () => {
    const refund = {
      cf_refund_id: "r1",
      cf_payment_id: "12345",
      order_id: order.order_id,
      refund_amount: 100,
      refund_currency: "INR",
      refund_status: "SUCCESS",
    };
    provider([payment], { order_status: "PAID" }, [
      refund,
      refund,
      { ...refund, cf_refund_id: "r2", refund_status: "PENDING" },
    ]);
    expect((await (await handleApi(request()))?.json()).refunded).toBe(100);
    expect(mocks.rpc).toHaveBeenCalledWith("record_verified_payment", {
      donation_id: id,
      provider_payment_id: "12345",
      refunded_paise: 10000,
    });
  });
  it("returns a retryable failure if the database cannot confirm payment", async () => {
    provider([payment], { order_status: "PAID" });
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "offline" } });
    expect((await handleApi(request()))?.status).toBe(503);
  });
  it("rejects malformed provider responses without persistence", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({})));
    expect((await handleApi(request()))?.status).toBe(502);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
