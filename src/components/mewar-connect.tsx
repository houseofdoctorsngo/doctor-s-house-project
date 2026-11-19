import { Building2, BriefcaseBusiness, Stethoscope } from "lucide-react";
import { useState } from "react";
import { HelpDesk } from "./help-desk";
import type { MewarTopic } from "../lib/ngo";
import { Button } from "./ui/button";

const opportunities = [
  {
    title: "Asset partners",
    hindi: "निवेशकों के लिए",
    icon: Building2,
    description: "Offer land, a building or medical equipment on lease for a rural hospital.",
    enquiries: [["Discuss an asset lease", "Asset lease"]],
  },
  {
    title: "Healthcare managers",
    hindi: "मैनेजमेंट के लिए",
    icon: BriefcaseBusiness,
    description:
      "Healthcare managers with an MHA or MBA can enquire about hospital leadership roles.",
    enquiries: [["Enquire about management roles", "Hospital management"]],
  },
  {
    title: "Medical staff",
    hindi: "मेडिकल स्टाफ",
    icon: Stethoscope,
    description:
      "Doctors, nurses, pharmacists and lab technicians can ask about hospital roles, pay, housing and allowances, or volunteer at a medical camp.",
    enquiries: [
      ["Enquire about hospital work", "Medical staff"],
      ["Volunteer at a medical camp", "Camp volunteering"],
    ],
  },
] as const;

function enquiryLink(topic: string) {
  return (
    "mailto:houseofdoctorsngo@gmail.com?subject=" + encodeURIComponent("Mewar Connect - " + topic)
  );
}

const buttonStyle = "h-auto min-h-11 whitespace-normal rounded-xl px-4 py-3 text-center leading-5";

export function MewarConnect() {
  const [topic, setTopic] = useState<MewarTopic | undefined>();
  function choose(value: MewarTopic) {
    setTopic(value);
    requestAnimationFrame(() => document.getElementById("mewar-enquiry")?.focus());
  }
  return (
    <>
      <p className="text-sm leading-6">
        Our goal is to establish 50 new hospitals for rural communities. Choose how you would like
        to take part.
      </p>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {opportunities.map(({ title, hindi, icon: Icon, description, enquiries }) => (
          <article key={title} className="flex flex-col rounded-xl bg-heal-soft p-5">
            <Icon aria-hidden="true" className="mb-3 text-primary" size={24} />
            <h3 className="text-lg">{title}</h3>
            <p lang="hi" className="text-sm text-muted-foreground">
              {hindi}
            </p>
            <p className="my-3 text-sm leading-6">{description}</p>
            <div className="mt-auto flex flex-col items-start gap-3 pt-2">
              {enquiries.map(([label, topic]) => (
                <Button
                  variant="mission"
                  key={topic}
                  type="button"
                  onClick={() => choose(topic)}
                  className={buttonStyle + " w-full"}
                >
                  {label}
                </Button>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 border-t pt-4">
        <h3 className="text-base">Want to help fund a camp?</h3>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-3">
          <Button
            variant="heal"
            type="button"
            onClick={() => choose("Camp funding")}
            className={buttonStyle}
          >
            Discuss camp funding
          </Button>
          <Button asChild variant="mission" className={buttonStyle}>
            <a href="#donate">Make a donation</a>
          </Button>
        </div>
      </div>
      {topic && (
        <section id="mewar-enquiry" tabIndex={-1} aria-label={topic + " enquiry"}>
          <HelpDesk key={topic} enquiry={topic} />
        </section>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        You can also{" "}
        <a href={enquiryLink(topic || "Partnership")} className="underline">
          email the partnerships team
        </a>{" "}
        or call{" "}
        <a href="tel:+917568968704" className="underline">
          +91 75689 68704
        </a>
        .
      </p>
    </>
  );
}
