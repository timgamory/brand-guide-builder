# Store Generated Document Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist the generated brand guide markdown in the `sessions` table, auto-updating whenever section approval state changes.

**Architecture:** Add a `generated_document TEXT` column to `sessions`. After any section approval/skip/status change in the store, regenerate the markdown from the updated session and write it to the DB in the same update call.

**Tech Stack:** Supabase (Postgres), Zustand, existing `generateMarkdown()` from `documentGenerator.ts`

---

### Task 1: Add `generatedDocument` to Session type

**Files:**
- Modify: `src/types/index.ts:37-48`

**Step 1: Add the field to Session type**

In `src/types/index.ts`, add `generatedDocument` to the `Session` type:

```typescript
export type Session = {
  id: string
  path: Path
  userSlug?: string
  brandData: BrandData
  sections: Record<string, SectionState>
  currentSection: string
  internMeta?: InternMeta
  reviewToken?: string
  generatedDocument?: string
  createdAt: string
  updatedAt: string
}
```

**Step 2: Run type check**

Run: `npx tsc -b`
Expected: PASS (new optional field breaks nothing)

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add generatedDocument field to Session type"
```

---

### Task 2: Add column mapping in storage layer

**Files:**
- Modify: `src/services/storage.ts:24-50`

**Step 1: Update `sessionFromRow` to read the column**

In `src/services/storage.ts`, add the `generated_document` mapping to `sessionFromRow`:

```typescript
function sessionFromRow(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    path: row.path as Session['path'],
    userSlug: row.user_slug as string | undefined,
    brandData: (row.brand_data ?? {}) as Session['brandData'],
    sections: (row.sections ?? {}) as Session['sections'],
    currentSection: row.current_section as string,
    internMeta: row.intern_meta as Session['internMeta'],
    reviewToken: row.review_token as string | undefined,
    generatedDocument: row.generated_document as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}
```

**Step 2: Update `sessionToRow` to write the column**

Add the `generatedDocument` mapping to `sessionToRow`:

```typescript
function sessionToRow(session: Partial<Session> & { id?: string }) {
  const row: Record<string, unknown> = {}
  if (session.id !== undefined) row.id = session.id
  if (session.path !== undefined) row.path = session.path
  if (session.userSlug !== undefined) row.user_slug = session.userSlug
  if (session.brandData !== undefined) row.brand_data = session.brandData
  if (session.sections !== undefined) row.sections = session.sections
  if (session.currentSection !== undefined) row.current_section = session.currentSection
  if (session.internMeta !== undefined) row.intern_meta = session.internMeta
  if (session.reviewToken !== undefined) row.review_token = session.reviewToken
  if (session.generatedDocument !== undefined) row.generated_document = session.generatedDocument
  return row
}
```

**Step 3: Run type check**

Run: `npx tsc -b`
Expected: PASS

**Step 4: Run existing storage tests**

Run: `npx vitest run src/services/__tests__/storage.test.ts`
Expected: PASS (existing tests unaffected)

**Step 5: Commit**

```bash
git add src/services/storage.ts
git commit -m "feat: add generatedDocument column mapping in storage layer"
```

---

### Task 3: Update store actions to regenerate document

**Files:**
- Modify: `src/stores/brandGuideStore.ts:1-5,100-128`

**Step 1: Import `generateMarkdown`**

At the top of `src/stores/brandGuideStore.ts`, add:

```typescript
import { generateMarkdown } from '../services/documentGenerator'
```

**Step 2: Update `approveSectionDraft` to regenerate document**

Replace the `approveSectionDraft` action (line 100-108):

```typescript
  approveSectionDraft: async (sectionId, draft) => {
    const { session } = get()
    if (!session) return
    const sections = {
      ...session.sections,
      [sectionId]: { ...session.sections[sectionId], status: 'approved' as const, approvedDraft: draft },
    }
    const updatedSession = { ...session, sections }
    const generatedDocument = generateMarkdown(updatedSession)
    await updateSession(session.id, { sections, generatedDocument })
    set({ session: { ...updatedSession, generatedDocument, updatedAt: new Date().toISOString() } })
  },
```

**Step 3: Update `skipSection` to regenerate document**

Replace the `skipSection` action (line 118-128):

```typescript
  skipSection: async (sectionId) => {
    const { session } = get()
    if (!session) return
    const sections = {
      ...session.sections,
      [sectionId]: { ...session.sections[sectionId], status: 'skipped' as const },
    }
    const updatedSession = { ...session, sections }
    const generatedDocument = generateMarkdown(updatedSession)
    await updateSession(session.id, { sections, generatedDocument })
    set({ session: { ...updatedSession, generatedDocument, updatedAt: new Date().toISOString() } })
    await get().nextSection()
  },
```

**Step 4: Update `updateSectionStatus` to regenerate document**

Replace the `updateSectionStatus` action (line 89-98):

```typescript
  updateSectionStatus: async (sectionId, status) => {
    const { session } = get()
    if (!session) return
    const sections = {
      ...session.sections,
      [sectionId]: { ...session.sections[sectionId], status },
    }
    const updatedSession = { ...session, sections }
    const generatedDocument = generateMarkdown(updatedSession)
    await updateSession(session.id, { sections, generatedDocument })
    set({ session: { ...updatedSession, generatedDocument, updatedAt: new Date().toISOString() } })
  },
```

**Step 5: Run type check**

Run: `npx tsc -b`
Expected: PASS

**Step 6: Run existing store tests**

Run: `npx vitest run src/stores/__tests__/brandGuideStore.test.ts`
Expected: PASS (mock storage accepts any updates)

**Step 7: Commit**

```bash
git add src/stores/brandGuideStore.ts
git commit -m "feat: regenerate document on section approval, skip, and status change"
```

---

### Task 4: Add test for document regeneration in store

**Files:**
- Modify: `src/stores/__tests__/brandGuideStore.test.ts`

**Step 1: Add mock for `generateMarkdown`**

After the existing storage mock block, add a mock for `documentGenerator`:

```typescript
vi.mock('../../services/documentGenerator', () => ({
  generateMarkdown: vi.fn((session: { brandData: { orgName?: string } }) => {
    return `# ${session.brandData.orgName || 'Brand'} Guide`
  }),
}))
```

**Step 2: Write test for approveSectionDraft setting generatedDocument**

Add to the describe block:

```typescript
  it('regenerates document when approving a draft', async () => {
    await useBrandGuideStore.getState().createNewSession('entrepreneur')
    await useBrandGuideStore.getState().updateBrandData({ orgName: 'Acme' })
    await useBrandGuideStore.getState().approveSectionDraft('basics', 'Acme is great.')
    const state = useBrandGuideStore.getState()
    expect(state.session!.generatedDocument).toBe('# Acme Guide')
  })
```

**Step 3: Write test for skipSection setting generatedDocument**

```typescript
  it('regenerates document when skipping a section', async () => {
    await useBrandGuideStore.getState().createNewSession('entrepreneur')
    await useBrandGuideStore.getState().updateBrandData({ orgName: 'Acme' })
    await useBrandGuideStore.getState().skipSection('basics')
    const state = useBrandGuideStore.getState()
    expect(state.session!.generatedDocument).toBe('# Acme Guide')
  })
```

**Step 4: Run the tests**

Run: `npx vitest run src/stores/__tests__/brandGuideStore.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/__tests__/brandGuideStore.test.ts
git commit -m "test: add tests for document regeneration on section changes"
```

---

### Task 5: Add SQL migration note

**Files:**
- Modify: `supabase/schema.sql`

**Step 1: Add the column to the schema file**

Add `generated_document TEXT` to the `sessions` CREATE TABLE statement in `supabase/schema.sql`:

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL CHECK (path IN ('entrepreneur', 'intern')),
  brand_data JSONB NOT NULL DEFAULT '{}',
  sections JSONB NOT NULL DEFAULT '{}',
  current_section TEXT NOT NULL DEFAULT 'basics',
  intern_meta JSONB,
  review_token TEXT,
  user_slug TEXT,
  generated_document TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Step 2: Commit**

```bash
git add supabase/schema.sql
git commit -m "schema: add generated_document column to sessions table"
```

**Step 3: Run the migration in Supabase**

Run this SQL in the Supabase Dashboard SQL Editor:

```sql
ALTER TABLE sessions ADD COLUMN generated_document TEXT;
```

---

### Task 6: Final verification

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 2: Run type check**

Run: `npx tsc -b`
Expected: No errors

**Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds
