-- StoryProof Database Schema

-- Reports table: stores completed scoring reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- File metadata (file itself is NOT stored)
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pptx', 'pdf')),
  slide_count INT NOT NULL,

  -- Audience context answers
  audience_type TEXT NOT NULL,
  presentation_purpose TEXT NOT NULL,
  audience_familiarity TEXT NOT NULL,
  regulatory_context TEXT NOT NULL,
  desired_outcome TEXT NOT NULL,

  -- Scores
  overall_score INT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  overall_grade TEXT NOT NULL CHECK (overall_grade IN ('Excellent', 'Good', 'Needs Work', 'Critical Issues')),
  category_scores JSONB NOT NULL,
  signal_scores JSONB NOT NULL,

  -- Report content
  critical_issues JSONB NOT NULL,
  quick_wins JSONB NOT NULL,
  category_findings JSONB NOT NULL,
  slide_assessments JSONB NOT NULL,
  upsell_recommendations JSONB NOT NULL,

  -- Lead capture (nullable until user provides email)
  email TEXT,
  lead_captured_at TIMESTAMPTZ
);

-- Leads table: for email capture events
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT NOT NULL,
  report_id UUID REFERENCES reports(id),
  persona TEXT,
  company TEXT,
  source TEXT DEFAULT 'storyproof'
);

-- Indexes
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_leads_email ON leads(email);

-- Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert reports (no auth required for lead magnet)
CREATE POLICY "Anyone can insert reports" ON reports FOR INSERT WITH CHECK (true);
-- Reports readable by ID (UUID acts as secret share link)
CREATE POLICY "Reports readable by id" ON reports FOR SELECT USING (true);
-- Allow updating reports (for email capture)
CREATE POLICY "Anyone can update reports" ON reports FOR UPDATE USING (true);

-- Anyone can insert leads
CREATE POLICY "Anyone can insert leads" ON leads FOR INSERT WITH CHECK (true);
-- Leads only readable by service role (admin)
CREATE POLICY "Leads only readable by service role" ON leads FOR SELECT USING (false);
