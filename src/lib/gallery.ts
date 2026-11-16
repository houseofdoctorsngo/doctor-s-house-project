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
  width?: number;
  height?: number;
};
export const galleryPhotos: GalleryPhoto[] = [
  {
    src: "/images/camps/community-consultations.jpg",
    title: "Care starts with a conversation",
    alt: "Doctors speaking with community members across a consultation table at a health camp.",
    credit: "The House of Doctor · Community consultations",
    width: 902,
    height: 570,
  },
  {
    src: "/images/camps/village-health-camp.jpg",
    title: "Healthcare close to home",
    alt: "A doctor writing at a consultation desk while women gather at a village health camp.",
    credit: "The House of Doctor · Village health camp",
    width: 1600,
    height: 900,
  },
  {
    src: "/images/camps/care-under-the-banyan.jpg",
    title: "Care under the banyan",
    alt: "Community members and the care team gathered around an outdoor consultation table beneath a banyan tree.",
    credit: "The House of Doctor · Community outreach",
    width: 1280,
    height: 960,
  },
  {
    src: "/images/camps/community-outreach.jpg",
    title: "Together at the community camp",
    alt: "A care team member assisting a young attendee while other visitors gather around the camp table.",
    credit: "The House of Doctor · Community outreach",
    width: 1280,
    height: 960,
  },
  {
    src: "/images/camps/field-care-team.jpg",
    title: "The people behind the care",
    alt: "The field care team standing together behind tables of camp supplies beneath leafy trees.",
    credit: "The House of Doctor · Field care team",
    width: 1600,
    height: 1327,
  },
  {
    kind: "video",
    src: "/videos/camps/camp-day.mp4",
    poster: "/images/camps/camp-day-video-poster.jpg",
    title: "A day at the health camp",
    alt: "Video of the care team and community members at a village health camp.",
    credit: "The House of Doctor · Field video · 31 seconds",
    transcript:
      "Visual description: The care team meets community members at a village health camp, with consultation desks and medical supplies set up in a school building. The closing shot shows the school exterior.",
  },
];
