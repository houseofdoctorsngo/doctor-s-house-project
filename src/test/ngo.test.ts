import { describe, expect, it } from "vitest";
import {
  assistanceSchema,
  defaultDonation,
  donationPresets,
  formatINR,
  receiptReference,
} from "../lib/ngo";
describe("NGO rules", () => {
  it("offers the published reference INR presets", () =>
    expect(donationPresets).toEqual([251, 501, 1100, 2100, 5100, 11000]));
  it("defaults to the reference INR 500 amount", () => expect(defaultDonation).toBe(500));
  it("formats Indian currency", () => expect(formatINR(1000)).toBe("₹1,000"));
  it("formats a dated NGO reference", () =>
    expect(receiptReference(new Date("2026-10-08T12:47:00Z"), "abc123")).toBe(
      "THD-20261008-ABC123",
    ));
  it("validates Indian mobile numbers", () => {
    const data = {
      name: "Test Person",
      phone: "+91 7568968704",
      village: "Udaipur",
      assistance_type: "Medicines",
    };
    expect(assistanceSchema.safeParse(data).success).toBe(true);
    expect(assistanceSchema.safeParse({ ...data, phone: "123" }).success).toBe(false);
  });
});
