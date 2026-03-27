-- Add user_id column to sessions (nullable for backwards compat)
ALTER TABLE sessions ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_sessions_user_id ON sessions (user_id) WHERE user_id IS NOT NULL;

-- Drop old permissive policies
DROP POLICY IF EXISTS "allow_all_sessions" ON sessions;
DROP POLICY IF EXISTS "allow_all_conversations" ON conversations;
DROP POLICY IF EXISTS "allow_all_reflections" ON reflections;
DROP POLICY IF EXISTS "allow_all_reviews" ON reviews;

-- Sessions: authenticated users access their own rows
CREATE POLICY "users_own_sessions" ON sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Conversations: access via session ownership
-- conversation.id format is "{sessionId}:{sectionId}"
CREATE POLICY "users_own_conversations" ON conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = split_part(conversations.id, ':', 1)::uuid
        AND sessions.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = split_part(conversations.id, ':', 1)::uuid
        AND sessions.user_id = auth.uid()
    )
  );

-- Reflections: access via session ownership
-- reflections.id = session.id
CREATE POLICY "users_own_reflections" ON reflections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = reflections.id
        AND sessions.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = reflections.id
        AND sessions.user_id = auth.uid()
    )
  );

-- Reviews: access via session ownership
CREATE POLICY "users_own_reviews" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = reviews.id
        AND sessions.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = reviews.id
        AND sessions.user_id = auth.uid()
    )
  );

-- Reviews: also allow access via review token (for fellow review — anon users)
CREATE POLICY "anon_review_token_access" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = reviews.id
        AND sessions.review_token IS NOT NULL
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = reviews.id
        AND sessions.review_token IS NOT NULL
    )
  );

-- Sessions: also allow read-only access by review_token for /review/:token page
CREATE POLICY "anon_review_token_session_read" ON sessions
  FOR SELECT USING (review_token IS NOT NULL);

-- Analytics: keep insert-only permissive (no sensitive data)
-- (analytics_events policy already allows all, leave it)
