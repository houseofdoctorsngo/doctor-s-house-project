import { createDonationReceipt, type ReceiptDetails } from "../lib/donation-receipt";
import logo from "../assets/ngo-logo.png?inline";
import font from "../assets/fonts/NotoSans-Regular.ttf?inline";
import hindiFont from "../assets/fonts/NotoSansDevanagari-Regular.ttf?inline";

export function generateReceipt(details: ReceiptDetails) {
  return createDonationReceipt(details, { logo, font, hindiFont }).output("arraybuffer");
}
