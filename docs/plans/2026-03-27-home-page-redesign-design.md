# Home Page Redesign — Design Document

## Context

The current home page is functional but sparse: title, subtitle, two path cards, footer. As the tool moves toward a paid product, the landing page needs to communicate value, set expectations, and address objections before asking visitors to commit. The primary audience is small business owners/entrepreneurs who may not know branding terminology or understand why they need a brand guide.

## Key Objections to Address

1. "Why do I need a brand guide?"
2. "I don't know enough about branding"
3. "How long will this take?"
4. "What will I actually get at the end?"

## Design Approach: Editorial Story Page

Treats the page like a magazine feature. Warm, confident tone — not salesy. Addresses objections in natural reading order: why → how → what → choose. Medium length (2-3 scrolls). Matches existing Fraunces + DM Sans + warm palette design language.

## Page Structure

### Section 1: Hero

**Headline** (Fraunces, large): "Your brand already exists. It just needs a guide."

**Subtext** (DM Sans, 18px, max-width constrained): "You already know what your business stands for. Brand Guide Builder draws it out through conversation and turns it into a professional document you can share with your team, your designer, or your website."

**CTA**: "Build Your Brand Guide" button — smooth-scrolls to path cards.

No image. Typography and whitespace do the work.

### Section 2: Why a Brand Guide?

Three cards on warm background (`bg-brand-bg-warm`), side-by-side desktop, stacked mobile. No icons — headlines carry the weight.

- **"Stop explaining yourself differently every time"** — Your website says one thing, your social media says another, and your elevator pitch changes weekly. A brand guide locks in the language so everyone's on the same page.
- **"Give your designer something to work with"** — When you hire someone to build your website or design a flyer, a brand guide tells them exactly what your brand sounds like, looks like, and stands for — no guesswork.
- **"Look like you've been doing this for years"** — A clear, consistent brand makes a two-person shop look as polished as a company ten times its size.

### Section 3: How It Works

Three numbered steps with large Fraunces step numbers ("01", "02", "03") in coral accent. Horizontal on desktop, stacked on mobile.

1. **Have a conversation** — Answer questions about your business the way you'd talk to a friend. The AI asks follow-ups, offers suggestions when you're stuck, and never uses jargon.
2. **Review your drafts** — After each topic, you'll see a polished draft of that section. Edit it, ask for revisions, or approve it and move on.
3. **Download your guide** — When all sections are complete, download a professional brand guide document ready to share with your team or designer.

Below steps: "Most people finish in 2-3 sessions. No branding experience needed."

### Section 4: What You'll Get

**Visual mockup**: A styled card resembling a brand guide page. Static sample content (Bright Path Consulting). Card has subtle rotation (1-2deg) and soft shadow for "document on a desk" feel. Shows brand story excerpt, values, and voice snippet.

**Section grid** (3 columns desktop, 2 mobile): The 11 sections with one-line descriptions:

- The Basics — Name, industry, and who you serve
- Your Story — Why you started and what drives you
- What You Stand For — The values behind every decision
- Brand Personality — How your brand acts and feels
- Colors — Your palette and when to use each color
- Logo — Usage rules and what to avoid
- Typography — Fonts that match your voice
- Messaging — Tagline, elevator pitch, key messages
- How It All Comes Together — Real-world applications
- Social Media — Voice and style for each platform
- Photography — The visual feel of your brand

### Section 5: Choose Your Path + Footer

**Heading**: "Ready to start?"

**Path cards**: Same two cards (entrepreneur / intern) as current. Name prompt modal appears after clicking if no slug set.

**Returning users**: "Continue where you left off" block with session cards appears above path cards when sessions exist.

**Reassurance line**: "Your progress is saved automatically. Come back anytime."

**Footer**: "Built by Elevate Digital" linking to elevatedigital.nyc.

## Visual Design Notes

- Page uses full-width sections with alternating backgrounds (brand-bg / brand-bg-warm) to create rhythm
- All within existing design system — no new colors, fonts, or tokens
- Fraunces for all headings, DM Sans for body
- Responsive: cards go from multi-column to single-column on mobile
- No animations beyond existing hover transitions — keep it fast and grounded

## File Changes

- `src/pages/PathSelection.tsx` — Complete rewrite of the page layout. Extract sections into components within the same file to keep it contained. No new files needed.
