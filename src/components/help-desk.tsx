import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Headphones,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { Button } from "./ui/button";
import { HumanVerification } from "./human-verification";
import { assistanceSchema, assistanceTypes, type MewarTopic } from "@/lib/ngo";
import { api, type PublicConfig } from "@/lib/api";
import { organisation } from "../lib/organisation";

export function HelpDesk({ enquiry }: { enquiry?: MewarTopic }) {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [reference, setReference] = useState("");
  const [id, setId] = useState("");
  const [humanToken, setHumanToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    setId(crypto.randomUUID());
    api<PublicConfig>("/api/config")
      .then(setConfig)
      .catch(() => setMessage("Online requests are unavailable. Please call our team."));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const parsed = assistanceSchema.safeParse(Object.fromEntries(fields));
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message || "Check your details.");
      return;
    }
    setSending(true);
    setMessage("");
    try {
      const result = await api<{ id: string }>("/api/assistance", {
        ...parsed.data,
        id,
        humanToken,
        consent: fields.get("consent") === "on",
        website: fields.get("website"),
      });
      setReference(result.id);
      form.reset();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to submit. Please call our team.",
      );
    } finally {
      setSending(false);
      setHumanToken("");
      setResetKey((key) => key + 1);
    }
  }
  return (
    <div className={enquiry ? "mt-5" : "reference-help grid gap-10 lg:grid-cols-2"}>
      {!enquiry && (
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-destructive">
            Get In Touch
          </span>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
            We're here whenever you need us.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Reach our team directly — for camp requests, patient help or volunteering opportunities.
          </p>
          <div className="mt-8 space-y-4">
            <a href="tel:+917568968704" className="card-3d flex items-center gap-4 rounded-2xl p-5">
              <span className="icon-badge bg-card">
                <Phone />
              </span>
              <span>
                <span className="text-xs text-muted-foreground block">Call Us</span>
                <strong className="text-base">+91 75689 68704</strong>
              </span>
              <ArrowRight size={17} className="ml-auto" />
            </a>
            {[organisation.email, organisation.otherEmail].map((email) => (
              <a
                key={email}
                href={"mailto:" + email}
                className="card-3d flex items-center gap-4 rounded-2xl p-5"
              >
                <span className="icon-badge">
                  <Mail />
                </span>
                <span>
                  <span className="block text-xs uppercase text-muted-foreground">Email Us</span>
                  <span className="font-semibold break-all">{email}</span>
                </span>
              </a>
            ))}
            <a
              href={
                "https://www.google.com/maps/search/?api=1&query=" +
                encodeURIComponent(organisation.address)
              }
              target="_blank"
              rel="noopener noreferrer"
              className="card-3d flex items-center gap-4 rounded-2xl p-5"
            >
              <span className="icon-badge">
                <MapPin />
              </span>
              <span>
                <span className="block text-xs uppercase text-muted-foreground">Location</span>
                <span className="font-semibold">{organisation.address}</span>
              </span>
              <ExternalLink size={14} />
            </a>
            <a
              className="btn-heal inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold sm:w-auto"
              href="https://wa.me/917568968704"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Headphones size={18} />
              Chat with Support
              <ExternalLink size={12} />
            </a>
            <p className="text-xs text-muted-foreground px-3 leading-6">
              This form is not monitored continuously. For urgent help, call directly. Please do not
              send medical records or identity documents through this form.
            </p>
          </div>
        </div>
      )}
      <div className="card-3d rounded-3xl p-6 sm:p-8">
        {reference ? (
          <div role="status" className="bg-heal-soft p-6 rounded-xl">
            <CheckCircle2 className="mb-3" />
            <h3 className="text-xl">Your request has been received.</h3>
            <p className="text-xs mt-3 break-all">Reference: {reference}</p>
            <p className="text-xs leading-6 mt-2">
              {enquiry
                ? "Our partnerships team can now follow up on your enquiry."
                : "Our team can review your request. This does not confirm an appointment or ambulance dispatch."}
            </p>
            <Button
              variant="heal"
              className="mt-4"
              onClick={() => {
                setReference("");
                setId(crypto.randomUUID());
              }}
            >
              Send another request
            </Button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h3 className="text-xl mb-4">
              {enquiry ? enquiry + " enquiry" : "Request Assistance"}
            </h3>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="field-label">Full Name</span>
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Full name"
                  className="field"
                />
              </label>
              <label className="block">
                <span className="field-label">Phone Number</span>
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  required
                  maxLength={14}
                  placeholder="+91 9876543210"
                  className="field"
                />
              </label>
              <label className="block">
                <span className="field-label">Village / Area</span>
                <input
                  name="village"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Your village or city"
                  className="field"
                />
              </label>
              {enquiry ? (
                <input type="hidden" name="assistance_type" value={enquiry} />
              ) : (
                <label className="block">
                  <span className="field-label">Type of Medical Assistance Needed</span>
                  <select name="assistance_type" className="field">
                    {assistanceTypes.map((type) => (
                      <option key={type} value={type}>
                        {
                          {
                            "Free camp": "Free Medical Camp Request",
                            Medicines: "Free Medicine",
                            "Doctor consultation": "Doctor Consultation / Prescription",
                            "Patient support": "Patient Support",
                            Other: "Other",
                            Ambulance: "Ambulance",
                            "Government schemes": "Government schemes",
                          }[type]
                        }
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <label className="hidden" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <label className="flex items-start gap-2 text-xs leading-5 mt-4">
              <input name="consent" type="checkbox" required className="mt-1" />
              <span>
                I agree that the NGO may store these details and contact me about this request.{" "}
                <a className="underline" href="#privacy">
                  Privacy information
                </a>
              </span>
            </label>
            <HumanVerification
              siteKey={config?.turnstileSiteKey || null}
              action="assistance"
              onToken={setHumanToken}
              resetKey={resetKey}
            />
            <Button
              variant="mission"
              type="submit"
              disabled={
                sending || !config?.assistanceEnabled || (!!config.turnstileSiteKey && !humanToken)
              }
              className="w-full mt-3"
            >
              {sending ? "Sending…" : "Submit Request"}
              <ArrowRight />
            </Button>
            {config && !config.assistanceEnabled && (
              <p className="text-xs mt-3">
                Online requests are not enabled yet. Please use the phone or email links.
              </p>
            )}
            {message && (
              <p className="text-destructive text-xs mt-3" role="alert">
                {message}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
