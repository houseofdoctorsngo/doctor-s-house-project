import { createServer } from "vite";
import { readFile, writeFile } from "node:fs/promises";

const server = await createServer({ configFile: false, server: { middlewareMode: true } });
try {
  const { createDonationReceipt } = await server.ssrLoadModule("/src/lib/donation-receipt.ts");
  const base64 = async (path) =>
    (await readFile(new URL(path, import.meta.url))).toString("base64");
  const assets = {
    logo: "data:image/png;base64," + (await base64("../src/assets/ngo-logo.png")),
    font: await base64("../src/assets/fonts/NotoSans-Regular.ttf"),
    hindiFont: await base64("../src/assets/fonts/NotoSansDevanagari-Regular.ttf"),
  };
  const sample = {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Aarav Sharma (sample)",
    email: "donor@example.com",
    phone: "+91 90000 00000",
    amount: 2100,
    orderId: "thd_sample_order_20261119",
    paymentId: "SAMPLE-1234567890",
    status: "captured",
    mode: "live",
    date: "2026-11-19T10:00:00+05:30",
    refunded: 0,
    paymentDate: "2026-11-19T10:02:00+05:30",
    paymentMethod: "upi",
    bankReference: "SAMPLE-UTR-123456",
  };
  const pdf = createDonationReceipt(sample, assets, true);
  await writeFile(
    new URL("../public/sample-donation-receipt.pdf", import.meta.url),
    Buffer.from(pdf.output("arraybuffer")),
  );
  console.log("Created public/sample-donation-receipt.pdf with sample data.");
} finally {
  await server.close();
}
