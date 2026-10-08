import { z } from "zod";

export const donationPresets = [500, 1000, 5000] as const;
export const defaultDonation = 1000;
export const formatINR = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
export const assistanceTypes = ["Free camp", "Medicines", "Doctor consultation", "Ambulance", "Government schemes"] as const;
export const assistanceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^(\+91 ?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
  village: z.string().trim().min(2).max(120),
  assistance_type: z.enum(assistanceTypes),
});
export const donorSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().trim().regex(/^(\+91 ?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
  amount: z.number().int().positive().max(10000000),
  upi: z.string().max(100).optional(),
});
export function receiptReference(date: Date, suffix: string) {
  const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date).replaceAll("-", "");
  return `THD-${stamp}-${suffix.toUpperCase().slice(0, 6)}`;
}