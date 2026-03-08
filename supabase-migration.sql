-- Migration: Notion → Supabase data layer
-- Run this in Supabase SQL Editor

-- 1. Add auth_user_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

-- 2. Goals table
CREATE TABLE goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL REFERENCES users(workspace_id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','complete','abandoned')),
  mode text NOT NULL DEFAULT 'checkbox' CHECK (mode IN ('checkbox','numerical')),
  target numeric,
  unit text NOT NULL DEFAULT '',
  due_date date,
  period_type text CHECK (period_type IN ('weekly','monthly','custom')),
  period_end date,
  current_period_start date,
  recurrence_mode text NOT NULL DEFAULT 'none' CHECK (recurrence_mode IN ('none','manual','auto')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_goals_workspace_status ON goals(workspace_id, status);

-- 3. Actions table
CREATE TABLE actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL REFERENCES users(workspace_id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','complete','abandoned')),
  target numeric,
  unit text NOT NULL DEFAULT '',
  due_date date,
  period_type text CHECK (period_type IN ('weekly','monthly','custom')),
  period_end date,
  current_period_start date,
  recurrence_mode text NOT NULL DEFAULT 'none' CHECK (recurrence_mode IN ('none','manual','auto')),
  lateral_link_target_id uuid REFERENCES actions(id) ON DELETE SET NULL,
  lateral_link_type text CHECK (lateral_link_type IN ('count','value')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_actions_workspace_status ON actions(workspace_id, status);
CREATE INDEX idx_actions_parent_goal ON actions(parent_goal_id);

-- 4. Logs table
CREATE TABLE logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL REFERENCES users(workspace_id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('goal','action')),
  source_id uuid NOT NULL,
  log_date date NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  entry_type text NOT NULL DEFAULT 'numeric' CHECK (entry_type IN ('numeric','boolean','review_correction')),
  period_label text NOT NULL DEFAULT '',
  is_closing_entry boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_logs_source ON logs(source_id, source_type);
CREATE INDEX idx_logs_workspace ON logs(workspace_id);
CREATE INDEX idx_logs_date ON logs(source_id, log_date);

-- 5. Enable RLS (policies use service role key, so no row-level policies needed for API)
-- If you want RLS later, add policies here.

-- 6. Drop Notion-specific columns (run AFTER confirming everything works)
-- ALTER TABLE users DROP COLUMN IF EXISTS encrypted_token;
-- ALTER TABLE users DROP COLUMN IF EXISTS goals_db_id;
-- ALTER TABLE users DROP COLUMN IF EXISTS actions_db_id;
-- ALTER TABLE users DROP COLUMN IF EXISTS logs_db_id;
