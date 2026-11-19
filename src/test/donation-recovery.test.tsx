import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("../lib/api", () => ({ api: mocks.api }));
vi.mock("../components/human-verification", () => ({ HumanVerification: () => null }));
import { Donation } from "../components/donation";
const access = { id: "11111111-1111-4111-8111-111111111111", token: "a".repeat(64) };
const checkout = {
  orderId: "order_recovered",
  amount: 100000,
  paymentSessionId: "session_test",
  mode: "test",
};
const summary = {
  ...access,
  name: "Test Donor",
  amount: 1000,
  status: "pending",
  mode: "test",
  refunded: 0,
  checkout,
};
beforeEach(() => {
  sessionStorage.setItem("thd-donation-session", JSON.stringify(access));
  mocks.api
    .mockReset()
    .mockImplementation(async (path) =>
      path === "/api/config"
        ? { paymentsMode: "test", turnstileSiteKey: null, assistanceEnabled: true }
        : summary,
    );
});
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  delete window.Cashfree;
});
describe("Donation checkout recovery in the browser", () => {
  it("shows the thank-you and receipt action only after a confirmed live payment", async () => {
    mocks.api.mockImplementation(async (path) =>
      path === "/api/config"
        ? { paymentsMode: "live", turnstileSiteKey: null, assistanceEnabled: true }
        : { ...summary, mode: "live", status: "captured", paymentId: "12345", checkout: null },
    );
    render(<Donation />);
    expect(
      screen.queryByRole("button", { name: "Download donation receipt" }),
    ).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Check payment status" }));
    expect(await screen.findByText(/Thank you, Test Donor/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Download donation receipt" })).toBeEnabled();
    expect(screen.getByText("Transaction ID: 12345")).toBeVisible();
  });
  it("recovers a lost order response and keeps controls disabled until the modal closes", async () => {
    let close: () => void = () => {};
    const opened = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          close = () => resolve({});
        }),
    );
    window.Cashfree = () => ({ checkout: opened });
    render(<Donation />);
    fireEvent.click(await screen.findByRole("button", { name: "Check payment status" }));
    const resume = await screen.findByRole("button", { name: "Resume this checkout" });
    await waitFor(() => expect(resume).toBeEnabled());
    fireEvent.click(resume);
    await waitFor(() => expect(opened).toHaveBeenCalledTimes(1));
    expect(opened).toHaveBeenCalledWith({
      paymentSessionId: checkout.paymentSessionId,
      redirectTarget: "_modal",
    });
    expect(screen.getByRole("button", { name: "Check payment status" })).toBeDisabled();
    expect(resume).toBeDisabled();
    expect(JSON.parse(sessionStorage.getItem("thd-donation-session")!)).toMatchObject({
      ...access,
      ...checkout,
    });
    await act(async () => close());
    await waitFor(() => expect(resume).toBeEnabled());
    expect(mocks.api.mock.calls.some(([path]) => path === "/api/payments/order")).toBe(false);
  });
  it("removes resume when an existing payment awaits capture", async () => {
    sessionStorage.setItem("thd-donation-session", JSON.stringify({ ...access, ...checkout }));
    mocks.api.mockImplementation(async (path) =>
      path === "/api/config"
        ? { paymentsMode: "test", turnstileSiteKey: null, assistanceEnabled: true }
        : { ...summary, checkout: null, awaitingCapture: true },
    );
    render(<Donation />);
    fireEvent.click(await screen.findByRole("button", { name: "Check payment status" }));
    await screen.findByText(/Your payment is still being processed/);
    expect(screen.queryByRole("button", { name: "Resume this checkout" })).not.toBeInTheDocument();
  });
});
