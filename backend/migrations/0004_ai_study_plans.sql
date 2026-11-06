-- Migration 0004: Create AI Study Planner tasks table
-- ai_study_plans was already created by migration 0003.

CREATE TABLE IF NOT EXISTS ai_study_plan_tasks (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT,
  estimated_duration_minutes INTEGER NOT NULL,
  module_name TEXT,
  module_order INTEGER,
  is_completed INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (plan_id)
    REFERENCES ai_study_plans(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_study_plan_tasks_plan_day
ON ai_study_plan_tasks (plan_id, day_number);

CREATE INDEX IF NOT EXISTS idx_ai_study_plan_tasks_user
ON ai_study_plan_tasks (user_id, plan_id);