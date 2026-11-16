// Add only NGO-approved images with permission from identifiable participants.
// Copy files into public/images/camps and use /images/camps/filename.jpg here.
export type GalleryPhoto = {
  src: string;
  title: string;
  alt: string;
  credit: string;
  kind?: "image" | "video";
  poster?: string;
  captions?: string;
  transcript?: string;
  tag?: string;
  width?: number;
  height?: number;
};
export const galleryPhotos: GalleryPhoto[] = [
  {
    src: "/images/camps/community-consultations.jpg",
    title: "Free Prescriptions",
    tag: "Health Camp",
    alt: "Doctors speaking with community members across a consultation table at a health camp.",
    credit: "The House of Doctor • Udaipur",
    width: 902,
    height: 570,
  },
  {
    src: "/images/camps/village-health-camp.jpg",
    title: "Patient Support",
    tag: "Health Camp",
    alt: "A doctor writing at a consultation desk while women gather at a village health camp.",
    credit: "The House of Doctor • Udaipur",
    width: 1600,
    height: 900,
  },
  {
    src: "/images/camps/care-under-the-banyan.jpg",
    title: "Free Medical Camps",
    tag: "Outreach",
    alt: "Community members and the care team gathered around an outdoor consultation table beneath a banyan tree.",
    credit: "The House of Doctor • Udaipur",
    width: 1280,
    height: 960,
  },
  {
    src: "/images/camps/community-outreach.jpg",
    title: "Community",
    tag: "Community",
    alt: "A care team member assisting a young attendee while other visitors gather around the camp table.",
    credit: "The House of Doctor • Udaipur",
    width: 1280,
    height: 960,
  },
  {
    src: "/images/camps/field-care-team.jpg",
    title: "Doctors on Duty",
    tag: "Team",
    alt: "The field care team standing together behind tables of camp supplies beneath leafy trees.",
    credit: "The House of Doctor • Udaipur",
    width: 1600,
    height: 1327,
  },
  {
    kind: "video",
    src: "/videos/camps/camp-day.mp4",
    poster: "/images/camps/camp-day-video-poster.jpg",
    title: "Health Camp",
    tag: "On-ground",
    alt: "Video of the care team and community members at a village health camp.",
    credit: "The House of Doctor • Udaipur",
  },
];
