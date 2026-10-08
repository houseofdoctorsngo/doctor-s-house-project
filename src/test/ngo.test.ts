import { describe, expect, it } from "vitest";
import { assistanceSchema, defaultDonation, donationPresets, formatINR, receiptReference } from "../lib/ngo";
describe("NGO rules", () => {
  it("offers the three requested INR presets", () => expect(donationPresets).toEqual([500, 1000, 5000]));
  it("defaults to INR 1000", () => expect(defaultDonation).toBe(1000));
  it("formats Indian currency", () => expect(formatINR(1000)).toBe("₹1,000"));
  it("formats a dated NGO reference", () => expect(receiptReference(new Date("2026-10-08T12:47:00Z"), "abc123")).toBe("THD-20261008-ABC123"));
  it("validates Indian mobile numbers", () => {
    const data = { name: "Test Person", phone: "+91 7568896804", village: "Udaipur", assistance_type: "Medicines" };
    expect(assistanceSchema.safeParse(data).success).toBe(true);
    expect(assistanceSchema.safeParse({ ...data, phone: "123" }).success).toBe(false);
  });
});