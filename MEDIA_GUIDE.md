# Field photos and videos

The gallery supports local images and videos with captions. Actual media has not yet been supplied for this release; the empty state stays honest rather than publishing invented camp photographs.

1. Supply approved photos/videos, a short title, location/date if known, credit and permission to publish identifiable people. Do not publish patient records, identity documents or unapproved clinical details. Obtain the appropriate guardian permission for identifiable children.
2. Optimise photos as JPG/WebP (roughly 1200-1800px wide). Remove unnecessary location metadata. Use descriptive filenames.
3. Export short videos as browser-compatible MP4 (H.264/AAC). Supply a poster image and a transcript; provide WebVTT captions for spoken content. Keep clips small enough for mobile data and Git hosting; use a separately approved media host for large originals.
4. Place public files in `public/images/camps/` and `public/videos/camps/`. Railway's deployed filesystem is temporary; do not manually upload files into a running container. Commit approved assets or use a configured persistent media service.
5. Add entries to `src/lib/gallery.ts`. Do not include `public` in the browser path:

```ts
export const galleryPhotos: GalleryPhoto[] = [
  { src: '/images/camps/approved-camp.jpg', title: 'Approved camp title', alt: 'Describe the activity shown', credit: 'NGO approved caption and date' },
  { kind: 'video', src: '/videos/camps/approved-outreach.mp4', poster: '/images/camps/outreach-poster.jpg', title: 'Approved outreach title', alt: 'Describe the activity in the video', credit: 'NGO approved caption and date', captions: '/videos/camps/outreach.en.vtt', transcript: 'Accurate transcript or description of the visual activity.' },
];
```

These filenames are examples, not existing assets. Do not add entries until the files exist.

Videos use native playback controls, inline mobile playback and no autoplay/download until requested (`preload=none`). The carousel does not advance while a video is selected; navigating away removes that player. Photos pause on hover/focus and respect reduced-motion preferences. Verify previous/next, captions, video sound and portrait/landscape layout after adding the real files.

Approved annual impact reports/proposals can later replace email-request buttons with real PDF links. Do not create fictional reports or financial/registration claims to fill placeholders.
