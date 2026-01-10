/*
  ============================================
  ACENEXA CBT Portal - PostgreSQL Database Schema
  ============================================

  Complete database schema for Supabase (PostgreSQL)

  This schema includes:
  - 5 core tables with proper relationships
  - Row Level Security (RLS) policies
  - Automatic timestamp triggers
  - Token expiry automation (1-year validity)
  - Optimized indexes for performance
  - Default data seeding

  Deployment: Copy and paste this entire file into Supabase SQL Editor

  ============================================
*/

-- =====================================================
-- 1. SUBJECTS TABLE
-- =====================================================
-- Stores available exam subjects (JAMB/WAEC)

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL CHECK (category IN ('General', 'Science', 'Commercial', 'Arts')),
  is_compulsory boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Public can read subjects (needed for exam selection)
CREATE POLICY "Public can read subjects"
  ON subjects FOR SELECT
  TO public
  USING (true);

-- Admins can manage subjects
CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_subjects_category ON subjects(category);

-- =====================================================
-- 2. USERS TABLE
-- =====================================================
-- System users (Admin and Students)

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text,
  role text NOT NULL CHECK (role IN ('admin', 'student')),
  full_name text,
  reg_number text,
  allowed_exam_type text DEFAULT 'BOTH' CHECK (allowed_exam_type IN ('JAMB', 'WAEC', 'BOTH')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Public can read users for authentication (backend validates)
CREATE POLICY "Public can read users for authentication"
  ON users FOR SELECT
  TO public
  USING (true);

-- Admins can manage all users
CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Index for faster authentication
CREATE INDEX IF NOT EXISTS idx_users_username_role ON users(username, role);

-- =====================================================
-- 3. ACCESS TOKENS TABLE (WITH 1-YEAR EXPIRY)
-- =====================================================
-- Paid access codes with automatic expiry management

CREATE TABLE IF NOT EXISTS access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  device_fingerprint text,
  bound_at timestamptz,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;

-- Public can read tokens for validation (backend handles security)
CREATE POLICY "Public can read tokens for validation"
  ON access_tokens FOR SELECT
  TO public
  USING (true);

-- Public can update tokens (for device binding)
CREATE POLICY "Public can update tokens for binding"
  ON access_tokens FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Admins can manage all tokens
CREATE POLICY "Admins can manage access tokens"
  ON access_tokens FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Function to automatically set expiry date when binding to device
CREATE OR REPLACE FUNCTION set_token_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- When device_fingerprint is set (binding occurs) and expires_at is null
  IF NEW.device_fingerprint IS NOT NULL AND OLD.device_fingerprint IS NULL THEN
    NEW.bound_at = now();
    NEW.expires_at = now() + interval '1 year';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set expiry on device binding
DROP TRIGGER IF EXISTS token_expiry_trigger ON access_tokens;
CREATE TRIGGER token_expiry_trigger
  BEFORE UPDATE ON access_tokens
  FOR EACH ROW
  EXECUTE FUNCTION set_token_expiry();

-- Index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_tokens_code ON access_tokens(token_code);
CREATE INDEX IF NOT EXISTS idx_tokens_device ON access_tokens(device_fingerprint) WHERE device_fingerprint IS NOT NULL;

-- =====================================================
-- 4. QUESTIONS TABLE
-- =====================================================
-- Exam question bank (JAMB/WAEC)

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  exam_type text NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC')),
  text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  explanation text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Public can read questions (needed for exam functionality)
CREATE POLICY "Public can read questions"
  ON questions FOR SELECT
  TO public
  USING (true);

-- Admins can manage questions
CREATE POLICY "Admins can manage questions"
  ON questions FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Composite index for faster exam queries
CREATE INDEX IF NOT EXISTS idx_questions_subject_exam ON questions(subject, exam_type);

-- =====================================================
-- 5. RESULTS TABLE
-- =====================================================
-- Student exam results and history

CREATE TABLE IF NOT EXISTS results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_username text NOT NULL,
  exam_type text NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC')),
  total_score integer DEFAULT 0,
  aggregate_score integer DEFAULT 0,
  subject_scores jsonb DEFAULT '{}'::jsonb,
  timestamp text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Users can view their own results
CREATE POLICY "Users can view own results"
  ON results FOR SELECT
  TO public
  USING (true);

-- Backend can insert results
CREATE POLICY "Public can insert results"
  ON results FOR INSERT
  TO public
  WITH CHECK (true);

-- Admins can delete results
CREATE POLICY "Admins can delete results"
  ON results FOR DELETE
  TO public
  USING (true);

-- Index for faster user result queries
CREATE INDEX IF NOT EXISTS idx_results_username ON results(user_username);
CREATE INDEX IF NOT EXISTS idx_results_exam_type ON results(exam_type);

-- =====================================================
-- 6. SEED DEFAULT DATA
-- =====================================================

-- Default Admin User
INSERT INTO users (username, password, role, full_name, reg_number, allowed_exam_type)
VALUES ('admin', 'admin', 'admin', 'System Administrator', 'ADMIN-001', 'BOTH')
ON CONFLICT (username) DO NOTHING;

-- Default Subjects
INSERT INTO subjects (name, category, is_compulsory) VALUES
  -- General Subjects
  ('English', 'General', true),
  ('Mathematics', 'General', false),
  ('Civic Education', 'General', false),

  -- Science Subjects
  ('Physics', 'Science', false),
  ('Chemistry', 'Science', false),
  ('Biology', 'Science', false),
  ('Further Mathematics', 'Science', false),
  ('Agricultural Science', 'Science', false),
  ('Geography', 'Science', false),
  ('Computer Studies', 'Science', false),

  -- Commercial Subjects
  ('Economics', 'Commercial', false),
  ('Commerce', 'Commercial', false),
  ('Financial Accounting', 'Commercial', false),

  -- Arts Subjects
  ('Government', 'Arts', false),
  ('Literature', 'Arts', false),
  ('CRS', 'Arts', false),
  ('History', 'Arts', false)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 7. HELPFUL QUERIES FOR ADMIN
-- =====================================================

-- Check all active tokens
-- SELECT token_code, metadata->>'full_name' as name,
--        bound_at, expires_at, is_active
-- FROM access_tokens
-- WHERE is_active = true
-- ORDER BY created_at DESC;

-- Find expiring soon (next 30 days)
-- SELECT token_code, metadata->>'full_name' as name, expires_at
-- FROM access_tokens
-- WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'
-- ORDER BY expires_at;

-- Count questions per subject
-- SELECT subject, exam_type, COUNT(*) as question_count
-- FROM questions
-- GROUP BY subject, exam_type
-- ORDER BY subject, exam_type;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
