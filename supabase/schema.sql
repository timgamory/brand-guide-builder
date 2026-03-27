-- Brand Guide Builder schema
-- Run this in Supabase Dashboard > SQL Editor

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL CHECK (path IN ('entrepreneur', 'intern')),
  brand_data JSONB NOT NULL DEFAULT '{}',
  sections JSONB NOT NULL DEFAULT '{}',
  current_section TEXT NOT NULL DEFAULT 'basics',
  intern_meta JSONB,
  review_token TEXT,
  user_slug TEXT,
  user_id UUID REFERENCES auth.users(id),
  generated_document TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_updated_at ON sessions (updated_at DESC);
CREATE INDEX idx_sessions_review_token ON sessions (review_token) WHERE review_token IS NOT NULL;
CREATE INDEX idx_sessions_user_id ON sessions (user_id) WHERE user_id IS NOT NULL;

-- Conversations table
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  messages JSONB NOT NULL DEFAULT '[]',
  research_tasks JSONB,
  conversation_summary TEXT,
  summarized_at_count INTEGER
);

-- Reflections table
CREATE TABLE reflections (
  id UUID PRIMARY KEY,
  entries JSONB NOT NULL DEFAULT '[]'
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  sections JSONB NOT NULL DEFAULT '{}'
);

-- Row Level Security (auth-scoped)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Sessions: authenticated users access their own rows
CREATE POLICY "users_own_sessions" ON sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Sessions: also allow read-only access by review_token for /review/:token page
CREATE POLICY "anon_review_token_session_read" ON sessions
  FOR SELECT USING (review_token IS NOT NULL);

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

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_session ON analytics_events (session_id);
CREATE INDEX idx_analytics_type_time ON analytics_events (event_type, created_at);
CREATE INDEX idx_analytics_time ON analytics_events (created_at);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_analytics" ON analytics_events FOR ALL USING (true) WITH CHECK (true);
