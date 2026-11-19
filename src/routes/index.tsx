import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home-page";
import { organisation } from "../lib/organisation";
const siteUrl = (import.meta.env["VITE_SITE_URL"] || "https://www.thehouseofdoctor.in").replace(
  /\/$/,
  "",
);
const title = "The House of Doctor — Free Rural Healthcare NGO, Udaipur";
const description =
  "Doctor-led NGO serving rural communities across Mewar with free medical camps, medicines, consultations and a 24×7 free ambulance. Healing communities, restoring hope.";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl },
      { property: "og:image", content: siteUrl + "/images/ngo-logo.png" },
      { name: "twitter:image", content: siteUrl + "/images/ngo-logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: siteUrl }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NGO",
          name: "The House of Doctor",
          url: siteUrl,
          description,
          foundingDate: "2024",
          telephone: "+91 75689 68704",
          email: [organisation.email, organisation.otherEmail],
          logo: siteUrl + "/images/ngo-logo.png",
          slogan: "Your health our responsibility",
          address: {
            "@type": "PostalAddress",
            streetAddress: "2nd floor, above Ajanta Book Distributors, New Bhopalpura",
            addressLocality: "Udaipur",
            addressRegion: "Rajasthan",
            addressCountry: "IN",
          },
          areaServed: {
            "@type": "Place",
            name: "Rural communities across Mewar, Rajasthan, India",
          },
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+91 75689 68704",
            contactType: "24×7 healthcare helpline",
            availableLanguage: ["English", "Hindi"],
          },
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <HomePage />;
}
