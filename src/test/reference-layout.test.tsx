import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("../lib/api", () => ({
  api: async () => ({ paymentsMode: "disabled", assistanceEnabled: false, turnstileSiteKey: null }),
}));
vi.mock("../components/human-verification", () => ({ HumanVerification: () => null }));
import { HomePage } from "../components/home-page";

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  Element.prototype.scrollIntoView = vi.fn();
  window.history.replaceState(null, "", "/");
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("renders the reference section order once, with retained details below donations", async () => {
  const { container } = render(<HomePage />);
  const ids = [...container.querySelectorAll("main [id]")].map((element) => element.id);
  const order = [
    "home",
    "about",
    "services",
    "gallery",
    "help-desk",
    "donate",
    "mewar-connect",
    "focus",
    "library",
    "publications",
  ];
  for (const id of order) expect(ids.filter((value) => value === id)).toHaveLength(1);
  expect(order.map((id) => ids.indexOf(id))).toEqual(
    order.map((id) => ids.indexOf(id)).sort((a, b) => a - b),
  );
  expect(screen.getByRole("heading", { name: "A house built on healing." })).toBeInTheDocument();
  expect(screen.queryByLabelText("Card Number")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("CVV")).not.toBeInTheDocument();
  await act(async () => {});
});

it("opens and closes the mobile menu without navigating away", async () => {
  render(<HomePage />);
  const toggle = screen.getByRole("button", { name: "Toggle menu" });
  fireEvent.click(toggle);
  expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
  await act(async () => {});
});

it("retains working policy anchors and opens supplemental sections from a hash", async () => {
  render(<HomePage />);
  window.history.replaceState(null, "", "/#privacy");
  fireEvent(window, new HashChangeEvent("hashchange"));
  expect(document.getElementById("privacy")).toHaveAttribute("open");
  window.history.replaceState(null, "", "/#mewar-connect");
  fireEvent(window, new HashChangeEvent("hashchange"));
  expect(screen.getByRole("button", { name: /Mewar Connect A bridge/ })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "#privacy");
  await act(async () => {});
});
