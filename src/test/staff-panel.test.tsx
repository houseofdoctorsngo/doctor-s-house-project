import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { StaffPanel } from "../components/staff-panel";

const { connect } = vi.hoisted(() => ({ connect: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: connect }));
vi.mock("../lib/api", () => ({
  api: async () => ({ url: "https://example.invalid", key: "test" }),
}));
afterEach(cleanup);

it("signs in, receives live transaction changes and lets the operator change their password", async () => {
  let changed: (() => void) | undefined;
  let paid = false;
  const channel = {
    on: (_event: unknown, _filter: unknown, handler: () => void) => {
      changed = handler;
      return channel;
    },
    subscribe: (handler: (status: string) => void) => {
      handler("SUBSCRIBED");
      return channel;
    },
  };
  const changePassword = vi.fn(async () => ({ error: null }));
  connect.mockReturnValue({
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: async () => ({ data: { user: { email: "staff@example.org" } } }),
      updateUser: changePassword,
      stopAutoRefresh: vi.fn(),
    },
    channel: () => channel,
    removeChannel: vi.fn(),
    rpc: (name: string, args?: { queue_name: string }) =>
      name === "is_ngo_staff"
        ? Promise.resolve({ data: true })
        : {
            abortSignal: async () => ({
              data:
                args?.queue_name === "donations"
                  ? [
                      {
                        id: "qa",
                        name: "Test donor",
                        phone: "000",
                        email: "qa@example.org",
                        created_at: null,
                        amount_paise: 12000,
                        amount_refunded: 0,
                        mode: "test",
                        provider: "cashfree",
                        order_id: "order_qa",
                        status: paid ? "captured" : "pending",
                        payment_id: paid ? "tx_qa" : null,
                      },
                    ]
                  : [],
            }),
          },
  });
  render(<StaffPanel />);
  expect(screen.queryByText("Transactions")).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled());
  fireEvent.change(screen.getByLabelText("Staff email"), {
    target: { value: "staff@example.org" },
  });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-only" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  fireEvent.click(await screen.findByRole("button", { name: "Donations" }));
  expect(await screen.findByText("pending")).toBeVisible();
  paid = true;
  await act(async () => {
    changed?.();
  });
  expect(await screen.findByText("tx_qa")).toBeVisible();
  expect(screen.getByText("captured")).toBeVisible();
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: "test-only-replacement" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
  expect(await screen.findByText("Password changed.")).toBeVisible();
  expect(changePassword).toHaveBeenCalledWith({ password: "test-only-replacement" });
});
