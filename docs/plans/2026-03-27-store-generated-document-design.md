# Store Generated Document in Database

**Date:** 2026-03-27

## Goal

Persist the final brand guide (as markdown) in Supabase so admins can access it directly from the database without needing the client app.

## Design

### Schema change

Add a nullable `generated_document TEXT` column to the `sessions` table:

```sql
ALTER TABLE sessions ADD COLUMN generated_document TEXT;
```

The column is `null` until the first section is approved.

### When to regenerate

Regenerate the markdown and write it to `generated_document` whenever section approval state changes:

1. **`approveSectionDraft()`** — section approved or revised
2. **`skipSection()`** — section removed from the guide
3. **`updateSectionStatus()`** — section status changed away from `approved`

### How it works

- After updating section state, call the existing `generateMarkdown(session)` function with the updated session object
- Write the result to `generated_document` via `updateSession()`
- The document stays in sync with every change — no stale artifacts

### What doesn't change

- Existing download buttons (Markdown + DOCX) continue to generate on the fly client-side
- No new tables, no storage buckets, no new API endpoints
- No UI changes needed

### Type changes

- Add `generatedDocument?: string` to the `Session` type
- Add `generated_document` mapping in `sessionToRow()` / `sessionFromRow()`
