import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home-page";
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
      { property: "og:image", content: siteUrl + "/images/ngo-logo.jpeg" },
      { name: "twitter:image", content: siteUrl + "/images/ngo-logo.jpeg" },
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
          foundingDate: "2023",
          telephone: "+91 75689 68704",
          email: "houseofdoctorsngo@gmail.com",
          slogan: "Healing communities, restoring hope.",
          address: {
            "@type": "PostalAddress",
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
