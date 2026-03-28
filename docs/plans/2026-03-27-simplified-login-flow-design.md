# Simplified Login Flow & Dashboard Design

**Date:** 2026-03-27
**Status:** Approved
**Goal:** Simplify the login flow by separating marketing, authentication, and session management into distinct pages.

## Problem

The current `PathSelection` page does too much: marketing content, login form, session list, and path selection. This makes the code complex and the UX confusing. With Supabase auth now in place, we can cleanly separate concerns.

## Design

### Route Structure

| Route | Component | Auth required? |
|---|---|---|
| `/` | `HomePage` | No |
| `/dashboard` | `Dashboard` | Yes (redirect to `/` if not) |
| `/auth/callback` | `AuthCallback` | No |
| `/wizard/:sectionId?` | `WizardShell > WizardSection` | Yes |
| `/preview` | `GuidePreview` | Yes |
| `/presentation` | `PresentationView` | Yes |
| `/review/:token` | `FellowReview` | No |

**Removed routes:** `/setup`, `/intern-setup`

### Navigation Flow

```
HomePage (/)
  ├─ Logged in? → sticky header shows avatar + "Dashboard" button
  ├─ "Get Started" clicked
  │   ├─ Logged in → redirect to /dashboard
  │   └─ Not logged in → show magic link form (inline)
  │       └─ Magic link clicked → /auth/callback → /dashboard
  │
Dashboard (/dashboard)
  ├─ Has sessions → session cards with "Continue" buttons
  ├─ "Start New Guide" → path selection (entrepreneur vs intern)
  │   ├─ Entrepreneur → create session → /wizard/basics
  │   └─ Intern → inline name/fellow inputs → create session → /wizard/basics
  └─ Sign out → back to /
```

### HomePage (`/`)

A pure marketing page. No session management, no path selection.

- **Sticky header:** Logo on left. If logged in: avatar circle (first letter of email) + "Dashboard" button on right. If not logged in: nothing (or subtle "Sign in" link).
- **Hero:** Headline, subheadline, single "Get Started" button.
- **Marketing sections:** Why / How It Works / What You'll Get — keep existing content as-is.
- **Footer:** "Built by Elevate Digital"

**"Get Started" behavior:**
- Logged in → `navigate('/dashboard')`
- Not logged in → scrolls to or reveals an inline magic link email form

**Removed from current PathSelection:** path selection cards, session list, session-loading logic, auto-redirect useEffect.

### Dashboard (`/dashboard`)

New component. Auth-gated — redirects to `/` if not logged in.

**Layout:** Simple centered layout (no sidebar). Same visual identity (warm off-white, Fraunces headings, DM Sans body). Header bar with logo + user avatar/email + Sign Out.

**Session list (if sessions exist):**
- Section heading: "Your Brand Guides"
- Cards showing: org name (or "Untitled"), path label, last updated, section progress, status
- "Continue" button per card → loads session → `/wizard`
- Delete button with confirmation

**Start new (always visible):**
- "Start New Guide" button
- Clicking reveals path selection inline: two cards for entrepreneur vs intern
- Entrepreneur → `createNewSession('entrepreneur')` → `/wizard/basics`
- Intern → shows inline name/fellow name inputs (replaces `/intern-setup` page) → `createNewSession('intern')` + `setInternMeta()` → `/wizard/basics`

### Changes to Existing Components

- **WizardShell:** Auth guard stays. No-session redirect changes from `/` to `/dashboard`.
- **Header (wizard):** No changes. Shows section context inside wizard.
- **Sidebar:** No changes.
- **AuthCallback:** Redirect target changes from `/` to `/dashboard`.
- **Stores:** No changes. Dashboard calls existing `loadSessions()`, `createNewSession()`, `loadSession()`.

### Deleted Files

- `src/pages/PathSelection.tsx` — replaced by `HomePage` + `Dashboard`
- `src/pages/InternSetup.tsx` — folded into Dashboard's "Start New" flow
- `src/pages/ApiKeySetup.tsx` — removed (Vercel proxy handles API calls)

## Key Simplifications

1. Marketing page has zero auth/session logic beyond a header check
2. All session management lives in one place (Dashboard)
3. Intern setup is inline, not a separate route
4. Three pages removed, two added — net reduction in complexity
5. Auth callback goes straight to dashboard — no intermediate redirect
