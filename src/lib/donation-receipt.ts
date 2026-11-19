import { jsPDF } from "jspdf";
import { organisation } from "./organisation";

export type ReceiptDetails = {
  id: string;
  name: string;
  email: string;
  phone: string;
  amount: number;
  orderId: string | null;
  paymentId: string | null;
  status: string;
  mode: string;
  date: string;
  refunded: number;
  paymentDate: string | null;
  paymentMethod: string | null;
  bankReference: string | null;
};
type Assets = { logo: string; font: string; hindiFont: string };
const money = (value: number) =>
  "INR " + value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }) + " IST";

export function createDonationReceipt(data: ReceiptDetails, assets: Assets, sample = false) {
  if (
    !data.paymentId ||
    !data.orderId ||
    !["captured", "partially_refunded", "refunded"].includes(data.status) ||
    !["test", "live"].includes(data.mode) ||
    !Number.isFinite(data.amount) ||
    data.amount <= 0 ||
    !Number.isFinite(data.refunded) ||
    data.refunded < 0 ||
    data.refunded > data.amount
  ) {
    throw new Error("A verified payment is required to issue a receipt.");
  }
  const pdf = new jsPDF({ compress: true });
  pdf.addFileToVFS("Receipt.ttf", assets.font.split(",").at(-1)!);
  pdf.addFont("Receipt.ttf", "Receipt", "normal");
  pdf.addFileToVFS("Hindi.ttf", assets.hindiFont.split(",").at(-1)!);
  pdf.addFont("Hindi.ttf", "Hindi", "normal");
  pdf.setFont("Receipt");
  pdf.setProperties({
    title: sample ? "Sample donation receipt" : "Donation receipt " + data.paymentId,
    author: organisation.name,
  });
  const margin = 18;
  let y = 18;
  const label = sample
    ? "SAMPLE - FOR PREVIEW ONLY"
    : data.mode === "test"
      ? "TEST PAYMENT - NO MONEY RECEIVED"
      : "OFFICIAL DONATION RECEIPT";
  pdf.setFillColor("#123b36");
  pdf.rect(0, 0, 210, 5, "F");
  pdf.addImage(assets.logo, "PNG", margin, y, 34, 28);
  pdf.setTextColor("#153c36");
  pdf.setFontSize(19);
  pdf.text(organisation.name, 59, y + 10);
  pdf.setFontSize(9);
  pdf.text("Your health our responsibility", 59, y + 18);
  y = 55;
  pdf.setFontSize(8.5);
  pdf.setTextColor("#475569");
  pdf.text(pdf.splitTextToSize(organisation.address, 174), margin, y);
  y += 11;
  pdf.text(organisation.email + "  |  " + organisation.phone, margin, y);
  y += 5;
  pdf.text(organisation.otherEmail + "  |  thehouseofdoctor.in", margin, y);
  y += 12;
  pdf.setDrawColor("#ccdcd8");
  pdf.line(margin, y, 192, y);
  y += 12;
  pdf.setFontSize(13);
  pdf.setTextColor(sample || data.mode === "test" ? "#ad3a32" : "#153c36");
  pdf.text(label, margin, y);
  y += 8;
  pdf.setFontSize(9);
  pdf.setTextColor("#475569");
  pdf.text("Receipt no. THD-CF-" + data.paymentId, margin, y, {
    maxWidth: 174,
  });
  y += 12;
  pdf.setFillColor("#eafff5");
  pdf.roundedRect(margin, y, 174, 25, 3, 3, "F");
  pdf.setTextColor("#153c36");
  pdf.setFontSize(9);
  pdf.text("Donation amount", margin + 7, y + 8);
  pdf.setFontSize(22);
  pdf.text(money(data.amount), margin + 7, y + 19);
  y += 36;

  // Wrap at Unicode code points and switch fonts for Hindi names.
  // This also keeps long email addresses and provider IDs inside the page.
  function detail(title: string, value: string) {
    if (y > 266) {
      pdf.addPage();
      y = 24;
    }
    pdf.setFontSize(8.5);
    pdf.setTextColor("#64748b");
    pdf.setFont("Receipt");
    pdf.text(title, margin, y);
    const clean = value.replace(/[\r\n\t\u0000-\u001f]/g, " ");
    const fontFor = (char: string) => (/[\u0900-\u097f]/.test(char) ? "Hindi" : "Receipt");
    let x = 65;
    pdf.setFontSize(9);
    pdf.setTextColor("#172d29");
    // Render runs so jsPDF preserves combining marks within each script.
    for (const run of clean.match(/[\u0900-\u097f]+|[^\u0900-\u097f]+/gu) || []) {
      pdf.setFont(fontFor(run[0]!));
      for (const word of run.split(/(?<=\s)/u)) {
        const width = pdf.getTextWidth(word);
        if (x + width > 192 && x > 65) {
          y += 5;
          x = 65;
        }
        const lines = pdf.splitTextToSize(word, 127) as string[];
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) {
            y += 5;
            x = 65;
          }
          if (y > 275) {
            pdf.addPage();
            y = 24;
          }
          pdf.text(lines[i]!, x, y);
          x += pdf.getTextWidth(lines[i]!);
        }
      }
    }
    y += 9;
  }
  detail("Received from", data.name);
  detail("Email", data.email);
  detail("Mobile", data.phone);
  detail("Purpose", "Support for community healthcare");
  detail(data.paymentDate ? "Payment date" : "Order date", date(data.paymentDate || data.date));
  detail(
    "Payment gateway",
    "Cashfree" + (data.paymentMethod ? " / " + data.paymentMethod.replaceAll("_", " ") : ""),
  );
  detail("Transaction ID", data.paymentId);
  detail("Order ID", data.orderId);
  if (data.bankReference) detail("Bank reference", data.bankReference);
  detail("Payment status", data.status.replaceAll("_", " "));
  if (data.refunded > 0) {
    detail("Refunded", money(data.refunded));
    detail("Net contribution", money(data.amount - data.refunded));
  }
  // Long donor details continue on another page without colliding with the footer.
  if (y > 247) {
    pdf.addPage();
    y = 24;
  }
  y += 3;
  pdf.setFont("Receipt");
  pdf.setFontSize(11);
  pdf.setTextColor("#153c36");
  pdf.text(
    data.status === "refunded"
      ? "Your payment record has been updated."
      : "Thank you for supporting our mission.",
    margin,
    y,
  );
  y += 7;
  pdf.setFontSize(9);
  pdf.text("Healing communities, restoring hope since 2024.", margin, y);
  pdf.setFontSize(8);
  pdf.setTextColor("#64748b");
  pdf.text(
    sample
      ? "Sample donor and transaction details. No donation was made."
      : data.mode === "test"
        ? "Sandbox transaction for testing. No donation was collected."
        : "Electronically generated from verified payment records.",
    margin,
    y + 12,
  );
  pdf.text("For tax documentation or corrections, please contact the NGO.", margin, y + 18);
  return pdf;
}
