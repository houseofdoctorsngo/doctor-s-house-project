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
};
export const galleryPhotos: GalleryPhoto[] = [];
