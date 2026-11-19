import { useEffect, useState, type FormEvent } from "react";
import { Heart, LockKeyhole, ShieldCheck, ArrowRight, Download, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { HumanVerification } from "./human-verification";
import { defaultDonation, donationPresets, donorSchema, formatINR } from "@/lib/ngo";
import { api, type PublicConfig } from "@/lib/api";

type Checkout = {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget: "_modal";
  }) => Promise<{ error?: { message?: string }; redirect?: boolean; paymentDetails?: unknown }>;
};
declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => Checkout;
  }
}
type Pending = {
  id: string;
  token: string;
  orderId?: string;
  paymentSessionId?: string;
  amount?: number;
  mode?: string;
};
type Confirmation = {
  id: string;
  name: string;
  amount: number;
  orderId: string | null;
  paymentId: string | null;
  status: string;
  mode: string;
  date: string;
  refunded: number;
  checkout?: { orderId: string; paymentSessionId: string; amount: number; mode: string } | null;
  awaitingCapture?: boolean;
  orderStatus?: string;
  retryOrder?: boolean;
};
const storageKey = "thd-donation-session";
let sdk: Promise<void> | undefined;
function loadCheckout() {
  if (window.Cashfree) return Promise.resolve();
  if (!sdk)
    sdk = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        sdk = undefined;
        script.remove();
        reject(new Error("Payment checkout could not load. Check your connection and try again."));
      };
      document.head.appendChild(script);
    });
  return sdk;
}
export function Donation() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [preset, setPreset] = useState<number | string>(defaultDonation);
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [humanToken, setHumanToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const amount = preset === "Custom" ? Number(custom) : Number(preset);
  useEffect(() => {
    api<PublicConfig>("/api/config")
      .then(setConfig)
      .catch(() =>
        setMessage("Online donations are currently unavailable. Please contact our team."),
      );
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (saved && typeof saved.id === "string" && /^[a-f0-9]{64}$/.test(saved.token))
        setPending(saved);
    } catch {
      /* Storage may be disabled. */
    }
  }, []);
  function remember(value: Pending | null) {
    setPending(value);
    try {
      if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* Checkout still works without storage. */
    }
  }
  async function check(current = pending) {
    if (!current) return null;
    const result = await api<Confirmation>("/api/payments/status", current);
    setConfirmation(result);
    if (result.checkout) remember({ id: current.id, token: current.token, ...result.checkout });
    if (result.awaitingCapture)
      setMessage(
        "Your payment is still being processed or awaiting confirmation. Do not pay again. Check its status shortly or contact our team.",
      );
    else if (result.orderStatus === "EXPIRED" || result.orderStatus === "TERMINATED")
      setMessage(
        "This checkout has expired or closed. If money was debited, contact our team before starting another donation.",
      );
    else if (result.status === "pending")
      setMessage(
        "Payment is not confirmed yet. If money was debited, wait and check again; do not make a second payment.",
      );
    else setMessage("");
    return result;
  }
  async function openCheckout(current: Pending) {
    if (
      !current.orderId ||
      !current.paymentSessionId ||
      !current.amount ||
      !["test", "live"].includes(current.mode || "")
    )
      throw new Error("Order creation is unresolved. Contact our team with the reference below.");
    await loadCheckout();
    if (!window.Cashfree) throw new Error("Payment provider did not load.");
    // The SDK result is only a prompt to verify on the server, never evidence of payment.
    await window
      .Cashfree({ mode: current.mode === "live" ? "production" : "sandbox" })
      .checkout({ paymentSessionId: current.paymentSessionId, redirectTarget: "_modal" });
    await check(current);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const parsed = donorSchema.safeParse({
      name: fields.get("name"),
      email: fields.get("email"),
      phone: fields.get("phone"),
      amount,
    });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message || "Check your details.");
      return;
    }
    setBusy(true);
    setMessage("");
    const current: Pending = {
      id: crypto.randomUUID(),
      token: Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
        n.toString(16).padStart(2, "0"),
      ).join(""),
    };
    remember(current);
    try {
      const order = await api<{
        orderId: string;
        amount: number;
        paymentSessionId: string;
        mode: string;
      }>("/api/payments/order", {
        ...parsed.data,
        ...current,
        humanToken,
        consent: fields.get("consent") === "on",
        website: fields.get("website"),
      });
      const ready = { ...current, ...order };
      remember(ready);
      await openCheckout(ready);
    } catch (error) {
      setBusy(false);
      setMessage(error instanceof Error ? error.message : "Unable to open checkout.");
    } finally {
      setBusy(false);
      setHumanToken("");
      setResetKey((key) => key + 1);
    }
  }
  async function action(callback: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await callback();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete the request.");
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    if (!pending) return;
    const response = await fetch("/api/payments/receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pending.id, token: pending.token }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Receipt download failed. Please try again.");
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = "THD-" + pending.id + "-receipt.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section id="donate" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-destructive">Give</p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Support Our Mission</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Every contribution helps us run one more camp, hand out one more strip of medicine, and
          reach one more village.
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-2xl">
        <div className="card-3d rounded-3xl p-6 sm:p-8">
          {!pending && (
            <>
              <h3 className="text-xl mb-4">Choose an amount</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[...donationPresets, "Custom"].map((value) => (
                  <Button
                    key={value}
                    variant="choice"
                    disabled={!!pending || busy}
                    aria-pressed={preset === value}
                    onClick={() => setPreset(value)}
                  >
                    {typeof value === "number" ? formatINR(value) : value}
                  </Button>
                ))}
              </div>
              {preset === "Custom" && (
                <label className="block mt-3">
                  <span className="field-label">Custom amount (INR)</span>
                  <input
                    className="field"
                    type="number"
                    min="1"
                    max="10000000"
                    step="1"
                    disabled={!!pending || busy}
                    value={custom}
                    onChange={(event) => setCustom(event.target.value)}
                    required
                  />
                </label>
              )}
            </>
          )}
          {config?.paymentsMode === "test" && (
            <p role="status" className="bg-heal-soft p-3 rounded-lg text-sm mb-4">
              Test mode — no real donation is collected.
            </p>
          )}
          {pending ? (
            <div className="space-y-4">
              {confirmation && confirmation.status !== "pending" && <CheckCircle2 />}
              <h3 className="text-xl">
                {confirmation && confirmation.status !== "pending"
                  ? confirmation.mode === "test"
                    ? "Test payment verified"
                    : "Payment verified"
                  : "Your donation checkout"}
              </h3>
              {confirmation?.status === "captured" && confirmation.mode === "live" && (
                <p className="rounded-xl bg-heal-soft p-4 text-base leading-7">
                  Thank you, {confirmation.name}, for your donation. Your support helps us bring
                  healthcare to our communities. Your official donation receipt is ready to
                  download.
                </p>
              )}
              <p className="text-xs break-all">Reference: {pending.id}</p>
              {confirmation && (
                <dl className="text-sm space-y-2">
                  <div>Amount: {formatINR(confirmation.amount)}</div>
                  <div>Status: {confirmation.status.replaceAll("_", " ")}</div>
                  {confirmation.paymentId && (
                    <div className="break-all">Transaction ID: {confirmation.paymentId}</div>
                  )}
                  {confirmation.refunded > 0 && (
                    <div>Refunded: {formatINR(confirmation.refunded)}</div>
                  )}
                </dl>
              )}
              <Button
                variant="heal"
                className="w-full"
                disabled={busy}
                onClick={() => action(() => check())}
              >
                Check payment status
              </Button>
              {(!confirmation || confirmation.status === "pending") &&
                !confirmation?.awaitingCapture &&
                pending.orderId &&
                config &&
                config.paymentsMode !== "disabled" && (
                  <Button
                    className="w-full"
                    variant="mission"
                    disabled={busy}
                    onClick={() =>
                      action(async () => {
                        const result = await check();
                        if (result?.checkout)
                          await openCheckout({
                            id: pending.id,
                            token: pending.token,
                            ...result.checkout,
                          });
                      })
                    }
                  >
                    Resume this checkout
                  </Button>
                )}
              {confirmation && confirmation.status !== "pending" && (
                <>
                  <Button
                    variant="mission"
                    className="w-full"
                    disabled={busy}
                    onClick={() => action(download)}
                  >
                    <Download />
                    Download donation receipt
                  </Button>
                  <p className="text-xs leading-6">
                    Your receipt includes the verified amount, transaction ID and donor details.
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      remember(null);
                      setConfirmation(null);
                      setMessage("");
                    }}
                  >
                    Start another donation
                  </Button>
                </>
              )}
              {(!confirmation || confirmation.status === "pending") && (
                <Button
                  variant="ghost"
                  className="text-xs whitespace-normal h-auto"
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Only clear this checkout if you have not paid or authorised a payment. If money was debited or the result is uncertain, cancel and contact the NGO with your reference. Clear the checkout?",
                      )
                    ) {
                      remember(null);
                      setConfirmation(null);
                      setMessage("");
                    }
                  }}
                >
                  Clear unpaid checkout and change details
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={submit}>
              <h3 className="text-xl mt-8 mb-4">Your details</h3>
              <div className="mt-5 grid gap-4">
                <label>
                  <span className="field-label">Full name</span>
                  <input
                    name="name"
                    autoComplete="name"
                    className="field"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </label>
                <label>
                  <span className="field-label">Email</span>
                  <input
                    name="email"
                    autoComplete="email"
                    className="field"
                    type="email"
                    required
                    maxLength={255}
                  />
                </label>
                <label className="block">
                  <span className="field-label">Mobile number</span>
                  <input
                    name="phone"
                    autoComplete="tel"
                    className="field"
                    type="tel"
                    placeholder="+91 9876543210"
                    required
                    maxLength={14}
                  />
                </label>
              </div>
              <label className="hidden" aria-hidden="true">
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
              <label className="flex gap-2 items-start text-xs leading-5 mt-4">
                <input name="consent" type="checkbox" required className="mt-1" />
                <span>
                  I agree to the{" "}
                  <a href="#terms" className="underline">
                    donation terms
                  </a>{" "}
                  and processing of my details as described in the{" "}
                  <a href="#privacy" className="underline">
                    privacy information
                  </a>
                  .
                </span>
              </label>
              <HumanVerification
                siteKey={config?.turnstileSiteKey || null}
                action="donation"
                onToken={setHumanToken}
                resetKey={resetKey}
              />
              <Button
                variant="mission"
                type="submit"
                className="w-full mt-5"
                disabled={
                  busy ||
                  !config ||
                  config.paymentsMode === "disabled" ||
                  (!!config.turnstileSiteKey && !humanToken)
                }
              >
                <LockKeyhole size={14} />
                {busy ? "Opening checkout…" : `Donate ${formatINR(amount || 0)}`}
                <ArrowRight className="ml-auto" />
              </Button>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck size={16} /> Secure payment through Cashfree
              </p>
              <a
                href="/sample-donation-receipt.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-xs underline underline-offset-4"
              >
                View a sample donation receipt
              </a>
              {config?.paymentsMode === "disabled" && (
                <p className="text-xs leading-6 mt-3">
                  Online donations are not enabled yet. No payment is taken here. Call our team for
                  verified donation arrangements.
                </p>
              )}
            </form>
          )}
          {pending && confirmation?.retryOrder && (
            <div className="mt-4">
              <p className="text-xs leading-6">
                Order creation was interrupted. Verify below to retry the same order safely.
              </p>
              <HumanVerification
                siteKey={config?.turnstileSiteKey || null}
                action="donation"
                onToken={setHumanToken}
                resetKey={resetKey}
              />
              <Button
                variant="heal"
                disabled={busy || (!!config?.turnstileSiteKey && !humanToken)}
                onClick={() =>
                  action(async () => {
                    try {
                      const result = await api<Confirmation>("/api/payments/resume", {
                        id: pending.id,
                        token: pending.token,
                        humanToken,
                      });
                      setConfirmation(result);
                      if (result.checkout) {
                        const ready = { ...pending, ...result.checkout };
                        remember(ready);
                        await openCheckout(ready);
                      }
                    } finally {
                      setHumanToken("");
                      setResetKey((key) => key + 1);
                    }
                  })
                }
              >
                Retry this order
              </Button>
            </div>
          )}
          {message && (
            <p role="alert" className="text-sm leading-6 mt-4">
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
