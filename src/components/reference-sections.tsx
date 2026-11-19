// Presentation and wording transcribed from the published Lovable site on 16 November 2026.
// See docs/REFERENCE_RESTORATION.md for sources and deliberate operational differences.
import { organisation } from "../lib/organisation";
export function ReferenceHero() {
  return (
    <section className="hero-bg relative overflow-hidden" id="home">
      <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-heal blur-3xl opacity-40"></div>
      <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-accent blur-3xl opacity-30"></div>
      <div className="absolute right-1/4 top-1/3 h-48 w-48 rounded-full bg-[var(--gold)] blur-3xl opacity-20"></div>
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto mb-14 flex max-w-3xl flex-col items-center text-center">
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-[var(--gold)]/25 via-heal-soft to-accent/20 blur-2xl"></div>
            <div className="rounded-[2rem] bg-white p-4 shadow-[var(--shadow-3d)] ring-1 ring-[var(--gold)]/40 sm:p-5">
              <img
                src="/images/ngo-logo.png"
                alt="The House of Doctor — official logo"
                className="logo-float block h-52 w-auto rounded-2xl object-contain sm:h-64 md:h-72"
              />
            </div>
            <span className="absolute -right-3 -top-3 inline-flex items-center gap-1 rounded-full bg-[image:var(--gradient-gold)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-[var(--shadow-gold)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-sparkles h-3 w-3"
                aria-hidden="true"
              >
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                <path d="M20 2v4"></path>
                <path d="M22 4h-4"></path>
                <circle cx="4" cy="20" r="2"></circle>
              </svg>
              {" Est. 2024"}
            </span>
          </div>
          <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-[var(--shadow-inset-3d)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-shield-check h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            {" Udaipur • Serving Tribal Villages"}
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
            {"The "}
            <span className="gold-text">{"House of Doctor"}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {
              "Free medical camps, medicines and prescriptions for tribal communities living out of reach of major hospitals."
            }
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#help-desk"
              className="btn-primary rounded-full px-6 py-3 text-sm font-semibold"
            >
              {"Request Assistance"}
            </a>
            <a
              href="#donate"
              className="rounded-full border-2 border-[var(--gold)]/60 bg-card px-6 py-3 text-sm font-semibold text-primary shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--gold)]"
            >
              {"Make a Donation"}
            </a>
          </div>
          <div className="mt-10 grid w-full max-w-2xl grid-cols-3 gap-4 sm:gap-8">
            <div className="rounded-2xl bg-card/60 px-3 py-4 shadow-[var(--shadow-inset-3d)] backdrop-blur">
              <div className="font-display text-xl font-semibold text-primary sm:text-2xl">
                {"2+ yrs"}
              </div>
              <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {"Serving Villages"}
              </div>
            </div>
            <div className="rounded-2xl bg-card/60 px-3 py-4 shadow-[var(--shadow-inset-3d)] backdrop-blur">
              <div className="font-display text-xl font-semibold text-primary sm:text-2xl">
                {"Doctor-Led"}
              </div>
              <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {"Qualified Team"}
              </div>
            </div>
            <div className="rounded-2xl bg-card/60 px-3 py-4 shadow-[var(--shadow-inset-3d)] backdrop-blur">
              <div className="font-display text-xl font-semibold text-primary sm:text-2xl">
                {"100%"}
              </div>
              <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {"Free of Cost"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export function ReferenceAbout() {
  return (
    <section id="about" className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <span className="text-xs font-semibold uppercase tracking-widest text-destructive">
        {"About Us"}
      </span>
      <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{"A house built on healing."}</h2>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        {"Based in "}
        <strong className="text-foreground">{"Udaipur, Rajasthan"}</strong>
        {", The House of Doctor has been operational for over"}
        <strong className="text-foreground">{" 2 years"}</strong>
        {
          ", run by a dedicated group of well-qualified doctors. We travel to tribal villages living out of reach of major medical facilities and provide free medical camps, free medicines, free prescriptions and continued support to patients suffering from disease."
        }
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="card-soft rounded-2xl p-6 text-left">
          <div className="font-display text-lg font-semibold">{"Doctor-Led"}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {"Qualified physicians volunteering their time."}
          </p>
        </div>
        <div className="card-soft rounded-2xl p-6 text-left">
          <div className="font-display text-lg font-semibold">{"Village-First"}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {"We go where roads and hospitals don't reach."}
          </p>
        </div>
        <div className="card-soft rounded-2xl p-6 text-left">
          <div className="font-display text-lg font-semibold">{"Always Free"}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {"Camps, medicines & prescriptions at zero cost."}
          </p>
        </div>
      </div>
    </section>
  );
}
export function ReferenceServices() {
  return (
    <section id="services" className="bg-muted/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-destructive">
            {"What we do"}
          </span>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{"Our Services"}</h2>
          <p className="mt-4 text-muted-foreground">
            {"Comprehensive rural care designed for the tribal communities of Udaipur."}
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-3d rounded-2xl p-6">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-heal text-primary shadow-[var(--shadow-inset-3d)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-users h-6 w-6"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </span>
            <h3 className="mt-5 text-lg font-semibold">{"Free Medical Camps"}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {
                "Regular health camps in tribal villages around Udaipur — bringing doctors to the doorstep."
              }
            </p>
          </div>
          <div className="card-3d rounded-2xl p-6">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-heal text-primary shadow-[var(--shadow-inset-3d)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-pill h-6 w-6"
                aria-hidden="true"
              >
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path>
                <path d="m8.5 8.5 7 7"></path>
              </svg>
            </span>
            <h3 className="mt-5 text-lg font-semibold">{"Free Medicines"}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {
                "Essential medicines distributed at zero cost to rural patients who cannot afford them."
              }
            </p>
          </div>
          <div className="card-3d rounded-2xl p-6">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-heal text-primary shadow-[var(--shadow-inset-3d)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-stethoscope h-6 w-6"
                aria-hidden="true"
              >
                <path d="M11 2v2"></path>
                <path d="M5 2v2"></path>
                <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"></path>
                <path d="M8 15a6 6 0 0 0 12 0v-3"></path>
                <circle cx="20" cy="10" r="2"></circle>
              </svg>
            </span>
            <h3 className="mt-5 text-lg font-semibold">{"Free Prescriptions"}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {
                "Expert consultation and written prescriptions from qualified doctors — completely free."
              }
            </p>
          </div>
          <div className="card-3d rounded-2xl p-6">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-heal text-primary shadow-[var(--shadow-inset-3d)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-ambulance h-6 w-6"
                aria-hidden="true"
              >
                <path d="M10 10H6"></path>
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"></path>
                <path d="M8 8v4"></path>
                <path d="M9 18h6"></path>
                <circle cx="17" cy="18" r="2"></circle>
                <circle cx="7" cy="18" r="2"></circle>
              </svg>
            </span>
            <h3 className="mt-5 text-lg font-semibold">{"Patient Support"}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {
                "Helping suffering patients of villages with follow-up care, referrals and disease management."
              }
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
export function ReferenceFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src="/images/ngo-logo.png"
                alt="The House of Doctor"
                className="h-11 w-11 rounded-xl object-cover shadow-[var(--shadow-inset-3d)]"
              />
              <span className="font-display text-lg font-semibold">{"The House of Doctor"}</span>
            </div>
            <p className="mt-4 text-base font-medium">Your health our responsibility</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Healing communities, restoring hope since 2024
            </p>
            <div className="mt-5 flex gap-3"></div>
          </div>
          <div>
            <div className="text-sm font-semibold">{"Contact"}</div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-map-pin mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                >
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <a
                  href={
                    "https://www.google.com/maps/search/?api=1&query=" +
                    encodeURIComponent(organisation.address)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  {organisation.address}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-mail h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                >
                  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                </svg>
                <div className="min-w-0 space-y-2">
                  {[organisation.email, organisation.otherEmail].map((email) => (
                    <a
                      key={email}
                      href={"mailto:" + email}
                      className="block hover:text-primary break-all"
                    >
                      {email}
                    </a>
                  ))}
                </div>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-phone h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                >
                  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
                </svg>
                <a href="tel:+917568968704" className="hover:text-primary">
                  {"+91 75689 68704"}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">{"Legal"}</div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#privacy" className="hover:text-primary">
                  {"Privacy Policy"}
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-primary">
                  {"Terms of Service"}
                </a>
              </li>
              <li>
                <a href="#accessibility" className="hover:text-primary">
                  {"Accessibility"}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <div>
            {"© "}
            {new Date().getFullYear()}
            {" The House of Doctor. All rights reserved."}
          </div>
          <div>{"Registered Non-Profit Organization"}</div>
        </div>
      </div>
    </footer>
  );
}
