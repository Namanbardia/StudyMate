
-- Migration 0003: Add AI Study Planner tables
-- Uses separate table names to preserve the existing study_plans table.

-- AI Study Plans
CREATE TABLE IF NOT EXISTS ai_study_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  knowledge_level TEXT NOT NULL
    CHECK (knowledge_level IN ('beginner', 'intermediate', 'advanced')),
  daily_study_time_minutes INTEGER NOT NULL,
  target_completion_date INTEGER NOT NULL,
  learning_goals TEXT,
  additional_instructions TEXT,
  total_estimated_days INTEGER,
  progress INTEGER NOT NULL DEFAULT 0,
  plan_data_json TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes for AI Study Plans
CREATE INDEX IF NOT EXISTS idx_ai_study_plans_user_created
ON ai_study_plans (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_study_plans_target_date
ON ai_study_plans (target_completion_date);


-- AI Study Plan Tasks
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

-- Indexes for AI Study Plan Tasks
CREATE INDEX IF NOT EXISTS idx_ai_study_plan_tasks_plan_day
ON ai_study_plan_tasks (plan_id, day_number);

CREATE INDEX IF NOT EXISTS idx_ai_study_plan_tasks_user
ON ai_study_plan_tasks (user_id, plan_id);
