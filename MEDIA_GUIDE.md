# Field photos and videos

On 16 November 2026, the owner supplied five photographs and one video and requested publication in Moments from the field. All six are included in `src/lib/gallery.ts`. The follow-up reference restoration uses the published Lovable site's 3D rotation, category/number badges and dot navigation. Visible captions use generic labels already on that reference; no event date, specific village or clinical claim is inferred from a filename.

The photos are web-sized JPEG copies (maximum 1600px on the longer edge, no copied EXIF metadata). Asset framing is retained; the gallery uses cover framing to fill the reference's rotating panels. The supplied 30.85-second H.264 MP4 is included unchanged (about 9.3 MB), with a poster from its first second. No spoken-audio transcript has been claimed. Original banners visible within the media may contain historical contact numbers; the site's current contact remains +91 75689 68704.

| Supplied file | Website file |
| --- | --- |
| IMG-20261115-WA0041.jpg | public/images/camps/community-consultations.jpg |
| IMG-20261115-WA0037.jpg | public/images/camps/village-health-camp.jpg |
| IMG-20261115-WA0001.jpg | public/images/camps/care-under-the-banyan.jpg |
| IMG-20261115-WA0040.jpg | public/images/camps/community-outreach.jpg |
| Screenshot_20261115_164559_Instagram.jpg | public/images/camps/field-care-team.jpg |
| VID-20261115-WA0033.mp4 | public/videos/camps/camp-day.mp4 |

For future additions:

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

Videos use native playback controls, inline mobile playback and no autoplay/download until requested (`preload=none`). An idle video poster rotates with the photos. Starting playback holds the video in place. Navigating away removes the player. Photos pause on hover/focus and respect reduced-motion preferences. Verify previous/next, captions, video sound and portrait/landscape layout after adding the real files.

Approved annual impact reports/proposals can later replace email-request buttons with real PDF links. Do not create fictional reports or financial/registration claims to fill placeholders.
