# The House of Doctor — Standalone 4-File Static Website

## Delivery approach
The current preview app stays exactly as it is. The new website is built as a separate download folder in Files, `the-house-of-doctor/`, which holds exactly four files and nothing else:

- `main.html`: all sections, plus vanilla JavaScript in one script element
- `main.css`: all styling, built on CSS variables
- `img.jpg`: one generated healthcare camp photo, web-optimised (about 1600px wide, under 250 KB)
- `README.md`

You also get a ZIP of that same folder. It contains only those four files.

Note: no screenshot came through with your message. The design will follow the written direction instead: mint/aqua background, navy serif headings, mint and white rounded cards, pill buttons, and a mobile-first layout tuned for 360–400px. If you re-attach the screenshot, I will match it more closely.

## Content rules
- Contact: I will use the helpline and email you gave earlier (+91 75688 96804, houseofdoctorsngo@gmail.com). Each one is marked in the code with a `REPLACE` comment. Social links, privacy policy and donation policy will be clearly labelled placeholders.
- No made-up figures, registration numbers, testimonials or publications. The hero cards show program categories, not numbers. Publication Desk entries are labelled "Example".
- The wording "tribal" never appears. I will say "rural communities across Mewar" instead.
- Donations: you can pick ₹250, ₹500, ₹1,000 or enter a custom amount. The form checks name, email and mobile, then shows a summary. The final button tells the visitor that online checkout is not yet active and offers the helpline and email instead. There is no fake success message and no card or UPI fields.

## Sections (in order)
Header with menu and Donate button → Hero → Identity card → Donation → Healthcare services (4) → Care without boundaries → Essential care (4) → Accordions (Mewar Health Centre, Other initiatives, Health education) → Gallery → Publication desk → Footer → Back-to-top button.

## Technical details
- Mobile menu: a button with aria-expanded that toggles the menu. It closes on Escape or when a link is tapped.
- Accordions: native `<details>`/`<summary>`, so they work even without JavaScript.
- Gallery: a CSS scroll-snap track with three panels, each showing a different crop of `img.jpg` through object-position, with captions and alt text. Prev/next buttons scroll the track. Swiping works natively.
- Smooth scrolling is switched off when the visitor prefers reduced motion. Focus outlines are clearly visible.
- Only relative paths (`./main.css`, `./img.jpg`), so it works from a GitHub Pages subpath. Fonts use the system serif/sans stack, so nothing loads from outside.
- The image has an onerror fallback that shows a gradient panel instead of a broken image.
- README covers: the file list, opening the site locally, uploading to GitHub, renaming `main.html` to `index.html` (or making a copy) for Pages, swapping the image, updating contacts, connecting a legitimate payment provider (Razorpay or Instamojo payment links), and a note that static HTML cannot process payments.

## Verification
Playwright at 375px, 768px and 1280px. Checks: screenshots, menu, every anchor link, amount selectors, custom amount and validation, accordions, gallery controls, back-to-top, and no console errors. Also confirm the folder and the ZIP each contain exactly four files.
