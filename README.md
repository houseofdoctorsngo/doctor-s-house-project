# Doctor's House Project

Act as an expert web developer and UI/UX designer. Build a complete, production-ready, responsive single-page website for The House of Doctor, an NGO based in Udaipur, Rajasthan, India. Build it on React + TypeScript + TanStack Start with Tailwind CSS v4 and lucide-react icons, using a single landing route (src/routes/index.tsx) and a root layout with SEO metadata. Make it premium, 3D-styled, compact (less scrolling), with organised openable accordion segments.



## 1. Brand & Mission

- Name: The House of Doctor (NGO, registered non-profit).

- Tagline: "Healing communities, restoring hope."

- Motto: "Quality healthcare is a right, not a privilege."

- Run by well-qualified doctors, operational for 2+ years (Est. 2023). Flagship rural hospital: Mewar Health Centre.

- Mission: help suffering patients in rural and periphery villages across Mewar with free medical camps, free medicines, free prescriptions, and a 24×7 free ambulance. Facilitate government health schemes (Ayushman Bharat, PMJAY).

- Contact details: +91 75688 96804 (24×7 helpline) and houseofdoctorsngo@gmail.com. Location: Udaipur, Rajasthan, India.

- Wording constraint: Do NOT use the word "tribal" anywhere — always use "rural communities across Mewar" or "remote and periphery villages".

- Tone: compassionate, clean, trustworthy, professional.



## 2. Visual Theme & 3D Styling (Derived from Logo)

The logo features a navy blue outline, mint green background, and a coral red cross. Build the full theme using semantic tokens in src/styles.css:

- `--background`: soft mint (oklch ≈ 0.97 0.04 160); `--foreground`: deep navy

- `--primary`: navy blue from logo (oklch ≈ 0.28 0.08 265); `--primary-foreground`: white; `--primary-soft`: pale blue

- `--heal`: mint healing green (oklch ≈ 0.85 0.09 160) + `--heal-soft`

- `--destructive`: coral red cross (oklch ≈ 0.68 0.19 25)

- Premium Gold Accents: `--gold` and `--gold-deep` for gold gradient headings (`gold-text`), gold rings around the logo and gallery frame, and an "Est. 2023" gold badge.

- Gradients: `--gradient-hero` (mint → light blue → mint), `--gradient-primary` (navy), `--gradient-coral`, `--gradient-gold`.

- 3D CSS Effects:

  - `--shadow-inset-3d`: tactile pressed button feel

  - `--shadow-card`, `--shadow-3d`: deep layered shadows with inner top highlights

  - `--shadow-gold`: warm gold glow for framed elements

  - Reusable classes: `.btn-primary`, `.btn-heal`, `.card-soft` (lift on hover), `.card-3d` (lift + 3D tilt on hover), `.logo-float` (slow 6s floating animation), `.gold-text`, `.gold-ring`.

- Fonts: Fraunces (serif display for h1/h2/headings/wordmark) + Inter (clean sans body text), imported via `<link>` in the route head.



## 3. Page Structure (in exact order)



### A. Sticky Navbar

- Blurred mint background with bottom hairline border.

- Layout: Hamburger toggle button (left) • Logo + "The House of Doctor" wordmark (Fraunces) with subtitle "Udaipur • Mewar Health Centre" • "Donate" pill button (right, btn-primary).

- Hamburger Drawer: Clicking toggles a left slide-out drawer (80% width, max-xs, white card, 3D shadow) over a dark backdrop. Includes: close button, nav links (Home, Donate, About, Services, Mewar Connect, Gallery, Publications, Help Desk), full-width "Donate Now" button, and direct phone/email contact links.



### B. Compact Hero (Top 1/3 Placement)

- Must be concise so the Donate section is visible near the top third without extensive scrolling.

- Two columns (stacks on mobile):

  - Left: Badge "🛡 Doctor-led NGO • Udaipur • 2+ years"; h1 "The House of Doctor" with "House of Doctor" in gold gradient text; motto in navy; concise mission summary; two pill CTA buttons ("Request Assistance" → Help Desk, "Support Our Mission" → Donate); 3-metric strip in frosted cards: "2+ yrs Serving", "24×7 Ambulance", "100% Free care".

  - Right: Logo displayed inside a white rounded frame with a gold ring, 3D shadow, smooth float animation, and a gold badge pinned to the top-right ("✨ Est. 2023").



### C. Priority Donation Section (Directly after Hero)

- Eyebrow "♥ Donate", heading "Fund a camp. Save a life." (gold gradient text), and impact line: "₹500 stocks a village medicine kit • ₹1,000 screens 20 patients • ₹5,000 powers one full camp day."

- Two 3D cards side by side:

  - Left Card (Amount & Payment Method):

    - Preset amounts: ₹500, ₹1,000 (default), ₹5,000, and Custom (reveals number input). All formatted in INR (`en-IN`).

    - Payment options: UPI (GPay / PhonePe), Card (Credit/Debit), NetBanking, Bank Transfer (NEFT/IMPS).

    - Security notice: "Card details are never stored by us — payments are tokenised by the gateway over HTTPS."

  - Right Card (Donor Form & Instant PDF Receipt):

    - Fields: Full Name, Email for receipt, Mobile number (+91 format), and optional UPI ID when UPI is chosen.

    - Submit button: "Donate ₹[Amount] Securely".

    - On submission: switches to an instant receipt confirmation showing Reference ID (`THD-YYYYMMDD-XXXXXX`), donor name, amount, date, and payment method.

    - Includes a full-width "**⬇ Download PDF receipt**" button powered by `jspdf` generating an official A4 receipt with NGO header, Udaipur address, helpline, thank-you note, and 80G tax exemption instructions.



### D. Organised Collapsible Segments (Accordions)

All remaining sections are enclosed in collapsible rounded-3xl cards with mint icon badges, Fraunces titles, and rotating chevron indicators (default open: About, Services, Gallery):

1. **About Us** (Heart-pulse icon): Overview of the 2+ years doctor-led mission, Mewar Health Centre rural hospital, and 3 soft cards: "Doctor-Led", "Village-First", "Always Free".

2. **Core Services** (Stethoscope icon): 4 cards in a grid:

   - Free Medical Camps (regular village visits)

   - Free Medicines (essential medications provided at zero cost)

   - Free Prescriptions (qualified doctor consultations)

   - 24×7 Free Ambulance (round-the-clock emergency transit)

3. **Mewar Connect — Corporate Hospital Partnership** (Ambulance icon):

   - Full strategic narrative connecting rural patients to tertiary corporate healthcare.

   - Dual comparison cards: "What We Bring" (on-ground trust, ambulance, patient pipeline, scheme facilitation) vs. "What Corporate Hospitals Bring" (advanced diagnostics, critical care, specialist doctors, clinical protocols).

   - Partnership process flow: Village → Mewar Ambulance → Corporate Hospital → Follow-up Care.

   - Challenges vs. Win-Win outcomes for rural patients, hospitals, and society.

   - CTA button: "Partner with Mewar Connect" (opens email draft).

4. **Focus Areas** (Award icon): 6 tag cards covering Rural Health Access, Maternal & Child Health, Non-Communicable Diseases, Emergency Response, Infrastructure Development, and Policy Advocacy.

5. **Health Education Library** (File-text icon): Live search bar filtering health topics (Hygiene, Diabetes Care, Maternal Health, First Aid Basics, Hypertension, Child Nutrition).

6. **3D Rotating Showcase Gallery** (Camera icon):

   - 3D perspective carousel with 6 rotating faces (`translateZ`, `rotateY`, smooth transitions).

   - Auto-rotates every 4.5 seconds with pause-on-hover, dot indicators, and prev/next arrow buttons.

   - Displays real camp photos with gold-ringed frames and category tags.

7. **Publication Desk** (Folder icon): Cards for Annual Impact Report, Mewar Connect Proposal, and Health Awareness Brochures.

8. **24/7 Help Desk** (Headphones/Message icon):

   - Contact tiles: 24×7 Phone (+91 75688 96804), Email, Udaipur Location, plus social links.

   - Assistance request form: Name, Phone, Village/City, Type of Assistance dropdown (Free camp, Medicines, Doctor consultation, Ambulance, Government schemes), and submit confirmation.



### E. Footer

- Navy/white contrast card with logo, mission statement, contact info, quick navigation links, and copyright notice.



## 4. Technical & SEO Specifications

- Full TanStack Router metadata in `head()`: dynamic title ("The House of Doctor — Free Rural Healthcare NGO, Udaipur"), meta description, OpenGraph tags, Twitter Card tags, and complete JSON-LD `NGO` schema with phone, email, and Udaipur location.

- Fully mobile-responsive, touch-friendly, semantic color tokens, and accessible interactive states.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c8719050-4b61-4ea2-9bbb-41f9a7d75bab).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
