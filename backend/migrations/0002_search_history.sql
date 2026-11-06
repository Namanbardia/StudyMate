-- Migration 0002: Add user-specific search history table
-- This is separate from the shared search_cache table

CREATE TABLE IF NOT EXISTS search_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  search_type TEXT NOT NULL CHECK (search_type IN ('all', 'videos', 'web')),
  result_json TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index for efficient user-specific queries ordered by recency
CREATE INDEX IF NOT EXISTS idx_search_history_user_created ON search_history (user_id, created_at DESC);

-- Index for cleaning up old entries if needed
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history (created_at);