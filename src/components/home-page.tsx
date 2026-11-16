import { useState, useEffect } from "react";
import { Menu, X, Award } from "lucide-react";
import { Donation } from "@/components/donation";
import { HelpDesk } from "@/components/help-desk";
import { Gallery } from "@/components/gallery";
import { NgoSections } from "@/components/ngo-sections";
import { Policies } from "@/components/policies";
import {
  ReferenceHero,
  ReferenceAbout,
  ReferenceServices,
  ReferenceFooter,
} from "@/components/reference-sections";
const logo = "/images/ngo-logo.jpeg";
const navigation = [
  ["Home", "home"],
  ["About", "about"],
  ["Services", "services"],
  ["Gallery", "gallery"],
  ["Help Desk", "help-desk"],
] as const;
export function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState<string[]>([]);
  useEffect(() => {
    const reveal = () => {
      const hash = window.location.hash.slice(1);
      const id = hash === "helpdesk" ? "help-desk" : hash;
      setMenuOpen(false);
      if (!id) return;
      setOpen((values) => (values.includes(id) ? values : [...values, id]));
      const target = document.getElementById(id);
      if (target instanceof HTMLDetailsElement) target.open = true;
      const timer = window.setTimeout(
        () =>
          target?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "instant"
              : "smooth",
          }),
        80,
      );
      return timer;
    };
    let timer = reveal();
    const changed = () => {
      window.clearTimeout(timer);
      timer = reveal();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("hashchange", changed);
    window.addEventListener("keydown", escape);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", changed);
      window.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] bg-card p-3"
      >
        Skip to main content
      </a>
      <header className="reference-header sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
        >
          <a href="#home" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white p-1 shadow-[var(--shadow-inset-3d)] ring-1 ring-border">
              <img
                src={logo}
                width={48}
                height={48}
                alt="The House of Doctor logo"
                className="h-full w-full rounded-md object-contain"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-semibold leading-tight tracking-tight sm:text-lg">
                The House of Doctor
              </span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:block">
                Udaipur • Since 2023
              </span>
            </span>
          </a>
          <div className="hidden items-center gap-4 lg:gap-8 md:flex">
            {navigation.map(([name, id]) => (
              <a
                key={id}
                href={"#" + id}
                className="text-sm font-medium text-muted-foreground transition hover:text-primary"
              >
                {name}
              </a>
            ))}
          </div>
          <a
            href="#donate"
            className="btn-primary hidden rounded-full px-5 py-2.5 text-sm font-semibold md:inline-flex"
          >
            Donate Now
          </a>
          <button
            type="button"
            className="md:hidden p-2"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>
        {menuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="border-t border-border bg-background md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {navigation.map(([name, id]) => (
                <a
                  key={id}
                  href={"#" + id}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  {name}
                </a>
              ))}
              <a
                href="#donate"
                onClick={() => setMenuOpen(false)}
                className="btn-primary mt-2 rounded-full px-4 py-2.5 text-center text-sm font-semibold"
              >
                Donate Now
              </a>
            </div>
          </nav>
        )}
      </header>
      <main id="main">
        <ReferenceHero />
        <ReferenceAbout />
        <ReferenceServices />
        <section
          id="gallery"
          className="relative overflow-hidden bg-gradient-to-b from-background via-heal-soft/40 to-background py-24"
        >
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-destructive">
              <Award className="h-3.5 w-3.5" /> Gallery
            </span>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Moments from <span className="gold-text">the field</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              A rotating look at our camps, patients and doctors across the villages of Udaipur.
            </p>
          </div>
          <div className="relative mx-auto mt-14 max-w-5xl px-4">
            <Gallery />
          </div>
        </section>
        <section id="help-desk" className="bg-muted/60 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <HelpDesk />
          </div>
        </section>
        <Donation />
        <NgoSections open={open} setOpen={setOpen} supplemental />
        <Policies />
      </main>
      <ReferenceFooter />
    </>
  );
}
