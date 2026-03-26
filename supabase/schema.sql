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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_updated_at ON sessions (updated_at DESC);
CREATE INDEX idx_sessions_review_token ON sessions (review_token) WHERE review_token IS NOT NULL;

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

-- Row Level Security (allow all via anon key)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_reflections" ON reflections FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
