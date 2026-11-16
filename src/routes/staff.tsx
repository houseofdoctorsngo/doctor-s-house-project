import { createFileRoute } from "@tanstack/react-router";
import { StaffPanel } from "../components/staff-panel";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff sign-in | The House of Doctor" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: StaffPanel,
});
