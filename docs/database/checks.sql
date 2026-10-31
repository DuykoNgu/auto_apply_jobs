-- Constraints that DBML cannot express. Apply after the SQL generated from acaj.dbml.
-- Each constraint names the business rule it protects.

-- One primary CV per user
CREATE UNIQUE INDEX cvs_one_primary_per_user ON cvs (user_id) WHERE is_primary;

-- Automation settings ranges (BR-019, BR-021)
ALTER TABLE automation_settings
  ADD CONSTRAINT automation_min_score_range CHECK (min_match_score BETWEEN 0 AND 100),
  ADD CONSTRAINT automation_daily_limit_range CHECK (daily_limit BETWEEN 1 AND 100),
  ADD CONSTRAINT automation_follow_up_days_range CHECK (follow_up_after_days BETWEEN 1 AND 30),
  ADD CONSTRAINT automation_max_follow_ups_range CHECK (max_follow_ups BETWEEN 0 AND 3);

-- Exactly one settings row, sane weights and thresholds (BR-007, BR-008, BR-014)
ALTER TABLE system_settings
  ADD CONSTRAINT system_settings_single_row CHECK (id = 1),
  ADD CONSTRAINT system_settings_weights CHECK (
    weight_skill >= 0 AND weight_semantic >= 0 AND weight_experience >= 0 AND weight_location >= 0
    AND weight_skill + weight_semantic + weight_experience + weight_location > 0),
  ADD CONSTRAINT system_settings_chance CHECK (0 <= chance_medium_min AND chance_medium_min < chance_high_min AND chance_high_min <= 100),
  ADD CONSTRAINT system_settings_gate CHECK (skill_gate_cap BETWEEN 0 AND 100),
  ADD CONSTRAINT system_settings_depth CHECK (inference_max_depth BETWEEN 1 AND 5),
  ADD CONSTRAINT system_settings_reply CHECK (reply_confidence_min BETWEEN 0 AND 1);

-- Skill taxonomy (BR-008)
ALTER TABLE skill_relations
  ADD CONSTRAINT skill_relations_no_self CHECK (from_skill_id <> to_skill_id);
ALTER TABLE skill_inferences
  ADD CONSTRAINT skill_inferences_depth CHECK (depth BETWEEN 1 AND 5),
  ADD CONSTRAINT skill_inferences_via CHECK ((depth = 1) = (via_skill_id IS NULL)),
  ADD CONSTRAINT skill_inferences_no_self CHECK (from_skill_id <> to_skill_id);

-- CV facts
ALTER TABLE cv_facts
  ADD CONSTRAINT cv_facts_confidence CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  ADD CONSTRAINT cv_facts_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

-- Job postings
ALTER TABLE job_postings
  ADD CONSTRAINT job_postings_salary CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min),
  ADD CONSTRAINT job_postings_email_channel CHECK (apply_channel <> 'EMAIL' OR apply_email IS NOT NULL);

-- Every requirement and insight quotes the JD (BR-009)
ALTER TABLE job_requirements
  ADD CONSTRAINT job_requirements_quote CHECK (0 <= quote_start AND quote_start < quote_end);
ALTER TABLE jd_insights
  ADD CONSTRAINT jd_insights_quote CHECK (0 <= quote_start AND quote_start < quote_end);

-- Match score and factors (BR-007)
ALTER TABLE matches
  ADD CONSTRAINT matches_score CHECK (score BETWEEN 0 AND 100),
  ADD CONSTRAINT matches_factors CHECK (
    factor_skill BETWEEN 0 AND 1 AND factor_semantic BETWEEN 0 AND 1
    AND factor_experience BETWEEN 0 AND 1 AND factor_location BETWEEN 0 AND 1);

-- An evidence row cites exactly one thing of its type (BR-009)
ALTER TABLE sentence_evidence
  ADD CONSTRAINT sentence_evidence_one_target CHECK (
    (type = 'FACT' AND fact_id IS NOT NULL
       AND inference_from_skill_id IS NULL AND inference_to_skill_id IS NULL AND requirement_id IS NULL)
    OR (type = 'INFERENCE' AND inference_from_skill_id IS NOT NULL AND inference_to_skill_id IS NOT NULL
       AND fact_id IS NULL AND requirement_id IS NULL)
    OR (type = 'JD_REQUIREMENT' AND requirement_id IS NOT NULL
       AND fact_id IS NULL AND inference_from_skill_id IS NULL AND inference_to_skill_id IS NULL));

-- Applications (BR-018 is the unique index in the DBML; BR-020 manual reason)
ALTER TABLE applications
  ADD CONSTRAINT applications_manual_reason CHECK (status <> 'MANUAL_REQUIRED' OR manual_reason IS NOT NULL),
  ADD CONSTRAINT applications_submitted_at CHECK (status IN ('QUEUED', 'MANUAL_REQUIRED', 'FAILED') OR submitted_at IS NOT NULL),
  ADD CONSTRAINT applications_follow_ups CHECK (follow_up_count >= 0);

-- Reply classification only on inbound mail (BR-014)
ALTER TABLE mail_messages
  ADD CONSTRAINT mail_messages_class_inbound CHECK (direction = 'INBOUND' OR (class IS NULL AND corrected_class IS NULL)),
  ADD CONSTRAINT mail_messages_confidence CHECK (class_confidence IS NULL OR class_confidence BETWEEN 0 AND 1);

-- A reply is sent only after the user confirms it (BR-022)
ALTER TABLE reply_drafts
  ADD CONSTRAINT reply_drafts_confirmed CHECK (
    status NOT IN ('CONFIRMED', 'SENT') OR (confirmed_by IS NOT NULL AND confirmed_at IS NOT NULL)),
  ADD CONSTRAINT reply_drafts_sent CHECK (status <> 'SENT' OR sent_message_id IS NOT NULL);

-- Task table
ALTER TABLE tasks
  ADD CONSTRAINT tasks_attempts CHECK (attempts >= 0 AND attempts <= max_attempts);
