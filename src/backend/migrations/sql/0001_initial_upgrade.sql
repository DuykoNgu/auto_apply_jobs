CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE user_role AS ENUM ('CANDIDATE', 'ADMIN');

CREATE TYPE mail_provider AS ENUM ('GMAIL', 'OUTLOOK');

CREATE TYPE connection_status AS ENUM ('ACTIVE', 'REVOKED', 'ERROR');

CREATE TYPE automation_mode AS ENUM ('AUTO', 'REVIEW_FIRST');

CREATE TYPE work_mode AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

CREATE TYPE seniority AS ENUM ('INTERN', 'FRESHER', 'JUNIOR', 'MIDDLE', 'SENIOR');

CREATE TYPE cv_source AS ENUM ('UPLOAD_FILE', 'UPLOAD_IMAGE', 'TEMPLATE_MANUAL', 'AI_GENERATED');

CREATE TYPE ai_status AS ENUM ('PENDING', 'READY', 'NEEDS_REVIEW', 'FAILED');

CREATE TYPE fact_kind AS ENUM ('PROFILE', 'SUMMARY', 'EXPERIENCE', 'PROJECT', 'EDUCATION', 'CERTIFICATE', 'SKILL_LIST');

CREATE TYPE skill_relation_type AS ENUM ('PARENT_OF', 'RELATED_TO');

CREATE TYPE source_kind AS ENUM ('TOPCV', 'LINKEDIN', 'COMPANY_SITE');

CREATE TYPE posting_status AS ENUM ('OPEN', 'EXPIRED');

CREATE TYPE apply_channel AS ENUM ('FORM', 'EMAIL', 'MANUAL_ONLY');

CREATE TYPE requirement_kind AS ENUM ('MUST', 'NICE');

CREATE TYPE insight_kind AS ENUM ('HIGHLIGHT', 'WEAKNESS', 'KEYWORD');

CREATE TYPE band_dimension AS ENUM ('LEVEL', 'INDUSTRY');

CREATE TYPE interview_chance AS ENUM ('HIGH', 'MEDIUM', 'LOW');

CREATE TYPE provenance AS ENUM ('ORIGINAL', 'REWRITTEN', 'INFERRED');

CREATE TYPE sentence_state AS ENUM ('ACTIVE', 'EDITED', 'REVERTED');

CREATE TYPE evidence_type AS ENUM ('FACT', 'INFERENCE', 'JD_REQUIREMENT');

CREATE TYPE application_mode AS ENUM ('MANUAL', 'AUTO');

CREATE TYPE application_status AS ENUM ('QUEUED', 'SUBMITTED', 'MANUAL_REQUIRED', 'FOLLOWED_UP', 'INTERVIEW', 'OFFER', 'REJECTED', 'FAILED');

CREATE TYPE message_direction AS ENUM ('OUTBOUND', 'INBOUND');

CREATE TYPE message_kind AS ENUM ('APPLICATION', 'FOLLOW_UP', 'REPLY', 'RECRUITER');

CREATE TYPE reply_class AS ENUM ('INTERVIEW', 'OFFER', 'REJECTED', 'UNKNOWN');

CREATE TYPE draft_status AS ENUM ('DRAFT', 'CONFIRMED', 'SENT', 'DISCARDED');

CREATE TYPE outcome AS ENUM ('INTERVIEW', 'OFFER', 'REJECTED', 'NO_RESPONSE');

CREATE TYPE feedback_target AS ENUM ('MATCH', 'SENTENCE', 'REPLY_CLASS', 'INSIGHT');

CREATE TYPE feedback_verdict AS ENUM ('USEFUL', 'NOT_USEFUL', 'WRONG_LABEL');

CREATE TYPE task_type AS ENUM ('PARSE_CV', 'COLLECT_JOBS', 'ANALYZE_JD', 'COMPUTE_MARKET', 'SCORE_MATCHES', 'OPTIMIZE_CV', 'SUBMIT_APPLICATION', 'SEND_FOLLOW_UP', 'POLL_INBOX', 'SEND_REPLY', 'PURGE_USER');

CREATE TYPE task_status AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TYPE audit_action AS ENUM ('REGISTER', 'LOGIN', 'LOGOUT', 'CV_UPLOAD', 'CV_UPDATE', 'SENTENCE_REVERT', 'TAILORED_APPROVE', 'APPLY_MANUAL', 'AUTOMATION_CHANGE', 'REPLY_CONFIRM', 'MAILBOX_CONNECT', 'ACCOUNT_DELETE', 'SOURCE_CHANGE', 'USER_STATUS_CHANGE', 'WEIGHTS_CHANGE');

CREATE TABLE app_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name varchar(120) NOT NULL,
  role user_role NOT NULL DEFAULT 'CANDIDATE',
  is_active boolean NOT NULL DEFAULT true,
  locale varchar(5) NOT NULL DEFAULT 'vi',
  delete_requested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE mailbox_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  provider mail_provider NOT NULL,
  email_address citext NOT NULL,
  token_encrypted bytea NOT NULL,
  scopes text[] NOT NULL,
  status connection_status NOT NULL DEFAULT 'ACTIVE',
  connected_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE automation_settings (
  user_id uuid NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  mode automation_mode NOT NULL DEFAULT 'AUTO',
  min_match_score smallint NOT NULL DEFAULT 70,
  daily_limit smallint NOT NULL DEFAULT 20,
  follow_up_after_days smallint NOT NULL DEFAULT 5,
  max_follow_ups smallint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

CREATE TABLE automation_excluded_companies (
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  PRIMARY KEY (user_id, company_id)
);

CREATE TABLE system_settings (
  id smallint NOT NULL DEFAULT 1,
  weight_skill smallint NOT NULL DEFAULT 40,
  weight_semantic smallint NOT NULL DEFAULT 20,
  weight_experience smallint NOT NULL DEFAULT 25,
  weight_location smallint NOT NULL DEFAULT 15,
  chance_high_min smallint NOT NULL DEFAULT 75,
  chance_medium_min smallint NOT NULL DEFAULT 50,
  skill_gate_cap smallint NOT NULL DEFAULT 39,
  inference_max_depth smallint NOT NULL DEFAULT 2,
  market_min_sample integer NOT NULL DEFAULT 30,
  reply_confidence_min numeric(3,2) NOT NULL DEFAULT 0.80,
  daily_token_quota integer NOT NULL DEFAULT 200000,
  weights_version integer NOT NULL DEFAULT 1,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL UNIQUE,
  PRIMARY KEY (id)
);

CREATE TABLE industries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL UNIQUE,
  PRIMARY KEY (id)
);

CREATE TABLE skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL UNIQUE,
  PRIMARY KEY (id)
);

CREATE TABLE skill_aliases (
  alias citext NOT NULL,
  skill_id uuid NOT NULL,
  PRIMARY KEY (alias)
);

CREATE TABLE skill_relations (
  from_skill_id uuid NOT NULL,
  to_skill_id uuid NOT NULL,
  type skill_relation_type NOT NULL,
  PRIMARY KEY (from_skill_id, to_skill_id)
);

CREATE TABLE skill_inferences (
  from_skill_id uuid NOT NULL,
  to_skill_id uuid NOT NULL,
  depth smallint NOT NULL,
  via_skill_id uuid,
  PRIMARY KEY (from_skill_id, to_skill_id)
);

CREATE TABLE courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title varchar(200) NOT NULL,
  provider varchar(120),
  url text,
  in_catalog boolean NOT NULL DEFAULT true,
  PRIMARY KEY (id)
);

CREATE TABLE course_skills (
  course_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  PRIMARY KEY (course_id, skill_id)
);

CREATE TABLE cvs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source cv_source NOT NULL,
  file_key text,
  status ai_status NOT NULL DEFAULT 'PENDING',
  is_primary boolean NOT NULL UNIQUE DEFAULT false,
  target_role varchar(120),
  target_seniority seniority,
  target_location_id uuid,
  target_work_mode work_mode,
  expected_salary_min integer,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE cv_facts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL,
  kind fact_kind NOT NULL,
  position smallint NOT NULL,
  title varchar(200),
  organization varchar(200),
  start_date date,
  end_date date,
  body text NOT NULL,
  confidence numeric(3,2),
  needs_review boolean NOT NULL DEFAULT false,
  UNIQUE (cv_id, position),
  PRIMARY KEY (id)
);

CREATE TABLE cv_fact_skills (
  fact_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  PRIMARY KEY (fact_id, skill_id)
);

CREATE TABLE attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title varchar(120) NOT NULL,
  file_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE job_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL UNIQUE,
  kind source_kind NOT NULL,
  base_url text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  requests_per_minute smallint NOT NULL DEFAULT 10,
  last_collected_at timestamptz,
  PRIMARY KEY (id)
);

CREATE TABLE companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL UNIQUE,
  industry_id uuid,
  website text,
  PRIMARY KEY (id)
);

CREATE TABLE job_postings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  external_id varchar(200) NOT NULL,
  url text NOT NULL,
  title varchar(200) NOT NULL,
  company_id uuid NOT NULL,
  location_id uuid,
  work_mode work_mode,
  seniority seniority,
  salary_min integer,
  salary_max integer,
  posted_at timestamptz,
  expires_at timestamptz,
  status posting_status NOT NULL DEFAULT 'OPEN',
  apply_channel apply_channel NOT NULL,
  apply_email citext,
  description text NOT NULL,
  analysis_status ai_status NOT NULL DEFAULT 'PENDING',
  embedding vector(1536),
  collected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, external_id),
  PRIMARY KEY (id)
);

CREATE TABLE job_requirements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  posting_id uuid NOT NULL,
  kind requirement_kind NOT NULL,
  skill_id uuid,
  text text NOT NULL,
  years_min smallint,
  quote_start integer NOT NULL,
  quote_end integer NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE jd_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  posting_id uuid NOT NULL,
  kind insight_kind NOT NULL,
  text text NOT NULL,
  quote_start integer NOT NULL,
  quote_end integer NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE market_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_key varchar(120) NOT NULL,
  seniority seniority NOT NULL,
  location_id uuid NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  sample_size integer NOT NULL,
  open_postings integer NOT NULL,
  applicants_per_posting numeric(6,1),
  salary_p25 integer,
  salary_p50 integer,
  salary_p75 integer,
  onsite_pct numeric(5,2),
  hybrid_pct numeric(5,2),
  remote_pct numeric(5,2),
  UNIQUE (role_key, seniority, location_id, computed_at),
  PRIMARY KEY (id)
);

CREATE TABLE market_monthly_postings (
  snapshot_id uuid NOT NULL,
  month date NOT NULL,
  postings integer NOT NULL,
  PRIMARY KEY (snapshot_id, month)
);

CREATE TABLE market_location_shares (
  snapshot_id uuid NOT NULL,
  location_id uuid NOT NULL,
  postings integer NOT NULL,
  PRIMARY KEY (snapshot_id, location_id)
);

CREATE TABLE market_salary_bands (
  snapshot_id uuid NOT NULL,
  dimension band_dimension NOT NULL,
  band_key varchar(80) NOT NULL,
  p25 integer NOT NULL,
  p50 integer NOT NULL,
  p75 integer NOT NULL,
  sample_size integer NOT NULL,
  PRIMARY KEY (snapshot_id, dimension, band_key)
);

CREATE TABLE market_skill_demand (
  snapshot_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  share_pct numeric(5,2) NOT NULL,
  PRIMARY KEY (snapshot_id, skill_id)
);

CREATE TABLE matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL,
  posting_id uuid NOT NULL,
  score smallint NOT NULL,
  chance interview_chance NOT NULL,
  factor_skill numeric(4,3) NOT NULL,
  factor_semantic numeric(4,3) NOT NULL,
  factor_experience numeric(4,3) NOT NULL,
  factor_location numeric(4,3) NOT NULL,
  weights_version integer NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cv_id, posting_id),
  PRIMARY KEY (id)
);

CREATE TABLE tailored_cvs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL,
  posting_id uuid NOT NULL,
  version smallint NOT NULL DEFAULT 1,
  status ai_status NOT NULL DEFAULT 'PENDING',
  ats_passed boolean,
  cover_letter text,
  pdf_key text,
  approved_at timestamptz,
  model varchar(80),
  prompt_version varchar(40),
  tokens_in integer,
  tokens_out integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cv_id, posting_id, version),
  PRIMARY KEY (id)
);

CREATE TABLE tailored_sentences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tailored_cv_id uuid NOT NULL,
  section fact_kind NOT NULL,
  position smallint NOT NULL,
  text text NOT NULL,
  provenance provenance NOT NULL,
  needs_review boolean NOT NULL DEFAULT false,
  state sentence_state NOT NULL DEFAULT 'ACTIVE',
  original_text text,
  UNIQUE (tailored_cv_id, section, position),
  PRIMARY KEY (id)
);

CREATE TABLE tailored_attachments (
  tailored_cv_id uuid NOT NULL,
  attachment_id uuid NOT NULL,
  PRIMARY KEY (tailored_cv_id, attachment_id)
);

CREATE TABLE sentence_evidence (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sentence_id uuid NOT NULL,
  type evidence_type NOT NULL,
  fact_id uuid,
  inference_from_skill_id uuid,
  inference_to_skill_id uuid,
  requirement_id uuid,
  PRIMARY KEY (id)
);

CREATE TABLE applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  posting_id uuid NOT NULL,
  tailored_cv_id uuid,
  mode application_mode NOT NULL,
  status application_status NOT NULL DEFAULT 'QUEUED',
  channel apply_channel,
  chance_at_apply interview_chance NOT NULL,
  manual_reason text,
  submitted_at timestamptz,
  follow_up_count smallint NOT NULL DEFAULT 0,
  last_follow_up_at timestamptz,
  UNIQUE (user_id, posting_id),
  PRIMARY KEY (id)
);

CREATE TABLE mail_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  direction message_direction NOT NULL,
  kind message_kind NOT NULL,
  provider_message_id varchar(200) NOT NULL UNIQUE,
  thread_id varchar(200),
  from_address citext NOT NULL,
  subject text,
  body text,
  at timestamptz NOT NULL,
  class reply_class,
  class_confidence numeric(3,2),
  corrected_class reply_class,
  PRIMARY KEY (id)
);

CREATE TABLE reply_drafts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  inbound_message_id uuid NOT NULL UNIQUE,
  to_address citext NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status draft_status NOT NULL DEFAULT 'DRAFT',
  confirmed_by uuid,
  confirmed_at timestamptz,
  sent_message_id uuid,
  PRIMARY KEY (id)
);

CREATE TABLE application_outcomes (
  application_id uuid NOT NULL,
  outcome outcome NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (application_id)
);

CREATE TABLE ai_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type feedback_target NOT NULL,
  target_id uuid NOT NULL,
  verdict feedback_verdict NOT NULL,
  corrected_value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id),
  PRIMARY KEY (id)
);

CREATE TABLE tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type task_type NOT NULL,
  status task_status NOT NULL DEFAULT 'QUEUED',
  user_id uuid,
  payload jsonb NOT NULL DEFAULT '{}',
  run_after timestamptz NOT NULL DEFAULT now(),
  attempts smallint NOT NULL DEFAULT 0,
  max_attempts smallint NOT NULL DEFAULT 3,
  locked_by varchar(80),
  locked_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE ai_calls (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  task_id uuid,
  operation varchar(40) NOT NULL,
  model varchar(80) NOT NULL,
  prompt_version varchar(40) NOT NULL,
  tokens_in integer NOT NULL,
  tokens_out integer NOT NULL,
  latency_ms integer NOT NULL,
  succeeded boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title varchar(200) NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  action audit_action NOT NULL,
  entity_type varchar(40),
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE mailbox_connections ADD CONSTRAINT mailbox_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE;

ALTER TABLE automation_settings ADD CONSTRAINT automation_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE;

ALTER TABLE automation_excluded_companies ADD CONSTRAINT automation_excluded_companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE;

ALTER TABLE automation_excluded_companies ADD CONSTRAINT automation_excluded_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies (id);

ALTER TABLE system_settings ADD CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES app_users (id) ON DELETE SET NULL;

ALTER TABLE skill_aliases ADD CONSTRAINT skill_aliases_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE CASCADE;

ALTER TABLE skill_relations ADD CONSTRAINT skill_relations_from_skill_id_fkey FOREIGN KEY (from_skill_id) REFERENCES skills (id) ON DELETE CASCADE;

ALTER TABLE skill_relations ADD CONSTRAINT skill_relations_to_skill_id_fkey FOREIGN KEY (to_skill_id) REFERENCES skills (id) ON DELETE CASCADE;

ALTER TABLE skill_inferences ADD CONSTRAINT skill_inferences_from_skill_id_fkey FOREIGN KEY (from_skill_id) REFERENCES skills (id) ON DELETE CASCADE;

ALTER TABLE skill_inferences ADD CONSTRAINT skill_inferences_to_skill_id_fkey FOREIGN KEY (to_skill_id) REFERENCES skills (id) ON DELETE CASCADE;

ALTER TABLE skill_inferences ADD CONSTRAINT skill_inferences_via_skill_id_fkey FOREIGN KEY (via_skill_id) REFERENCES skills (id) ON DELETE SET NULL;

ALTER TABLE course_skills ADD CONSTRAINT course_skills_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE;

ALTER TABLE course_skills ADD CONSTRAINT course_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE CASCADE;

ALTER TABLE cvs ADD CONSTRAINT cvs_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE;

ALTER TABLE cvs ADD CONSTRAINT cvs_target_location_id_fkey FOREIGN KEY (target_location_id) REFERENCES locations (id) ON DELETE SET NULL;

ALTER TABLE cv_facts ADD CONSTRAINT cv_facts_cv_id_fkey FOREIGN KEY (cv_id) REFERENCES cvs (id) ON DELETE CASCADE;

ALTER TABLE cv_fact_skills ADD CONSTRAINT cv_fact_skills_fact_id_fkey FOREIGN KEY (fact_id) REFERENCES cv_facts (id) ON DELETE CASCADE;

ALTER TABLE cv_fact_skills ADD CONSTRAINT cv_fact_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE CASCADE;

ALTER TABLE attachments ADD CONSTRAINT attachments_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE;

ALTER TABLE companies ADD CONSTRAINT companies_industry_id_fkey FOREIGN KEY (industry_id) REFERENCES industries (id) ON DELETE SET NULL;

ALTER TABLE job_postings ADD CONSTRAINT job_postings_source_id_fkey FOREIGN KEY (source_id) REFERENCES job_sources (id);

ALTER TABLE job_postings ADD CONSTRAINT job_postings_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies (id);

ALTER TABLE job_postings ADD CONSTRAINT job_postings_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE SET NULL;

ALTER TABLE job_requirements ADD CONSTRAINT job_requirements_posting_id_fkey FOREIGN KEY (posting_id) REFERENCES job_postings (id) ON DELETE CASCADE;

ALTER TABLE job_requirements ADD CONSTRAINT job_requirements_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE SET NULL;

ALTER TABLE jd_insights ADD CONSTRAINT jd_insights_posting_id_fkey FOREIGN KEY (posting_id) REFERENCES job_postings (id) ON DELETE CASCADE;

ALTER TABLE market_snapshots ADD CONSTRAINT market_snapshots_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations (id);

ALTER TABLE market_monthly_postings ADD CONSTRAINT market_monthly_postings_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES market_snapshots (id) ON DELETE CASCADE;

ALTER TABLE market_location_shares ADD CONSTRAINT market_location_shares_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES market_snapshots (id) ON DELETE CASCADE;

ALTER TABLE market_location_shares ADD CONSTRAINT market_location_shares_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations (id);

ALTER TABLE market_salary_bands ADD CONSTRAINT market_salary_bands_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES market_snapshots (id) ON DELETE CASCADE;

ALTER TABLE market_skill_demand ADD CONSTRAINT market_skill_demand_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES market_snapshots (id) ON DELETE CASCADE;

ALTER TABLE market_skill_demand ADD CONSTRAINT market_skill_demand_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE CASCADE;

ALTER TABLE matches ADD CONSTRAINT matches_cv_id_fkey FOREIGN KEY (cv_id) REFERENCES cvs (id) ON DELETE CASCADE;

ALTER TABLE matches ADD CONSTRAINT matches_posting_id_fkey FOREIGN KEY (posting_id) REFERENCES job_postings (id);

ALTER TABLE tailored_cvs ADD CONSTRAINT tailored_cvs_cv_id_fkey FOREIGN KEY (cv_id) REFERENCES cvs (id) ON DELETE CASCADE;

ALTER TABLE tailored_cvs ADD CONSTRAINT tailored_cvs_posting_id_fkey FOREIGN KEY (posting_id) REFERENCES job_postings (id);

ALTER TABLE tailored_sentences ADD CONSTRAINT tailored_sentences_tailored_cv_id_fkey FOREIGN KEY (tailored_cv_id) REFERENCES tailored_cvs (id) ON DELETE CASCADE;

ALTER TABLE tailored_attachments ADD CONSTRAINT tailored_attachments_tailored_cv_id_fkey FOREIGN KEY (tailored_cv_id) REFERENCES tailored_cvs (id) ON DELETE CASCADE;

ALTER TABLE tailored_attachments ADD CONSTRAINT tailored_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES attachments (id) ON DELETE CASCADE;

ALTER TABLE sentence_evidence ADD CONSTRAINT sentence_evidence_sentence_id_fkey FOREIGN KEY (sentence_id) REFERENCES tailored_sentences (id) ON DELETE CASCADE;

ALTER TABLE sentence_evidence ADD CONSTRAINT sentence_evidence_fact_id_fkey FOREIGN KEY (fact_id) REFERENCES cv_facts (id) ON DELETE CASCADE;

ALTER TABLE sentence_evidence ADD CONSTRAINT sentence_evidence_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES job_requirements (id) ON DELETE CASCADE;

ALTER TABLE applications ADD CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE;

ALTER TABLE applications ADD CONSTRAINT applications_posting_id_fkey FOREIGN KEY (posting_id) REFERENCES job_postings (id);

ALTER TABLE applications ADD CONSTRAINT applications_tailored_cv_id_fkey FOREIGN KEY (tailored_cv_id) REFERENCES tailored_cvs (id) ON DELETE SET NULL;

ALTER TABLE mail_messages ADD CONSTRAINT mail_messages_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE;

ALTER TABLE reply_drafts ADD CONSTRAINT reply_drafts_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE;

ALTER TABLE reply_drafts ADD CONSTRAINT reply_drafts_inbound_message_id_fkey FOREIGN KEY (inbound_message_id) REFERENCES mail_messages (id) ON DELETE CASCADE;

ALTER TABLE reply_drafts ADD CONSTRAINT reply_drafts_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES app_users (id) ON DELETE SET NULL;

ALTER TABLE reply_drafts ADD CONSTRAINT reply_drafts_sent_message_id_fkey FOREIGN KEY (sent_message_id) REFERENCES mail_messages (id);

ALTER TABLE application_outcomes ADD CONSTRAINT application_outcomes_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE;

ALTER TABLE ai_feedback ADD CONSTRAINT ai_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE;

ALTER TABLE tasks ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE SET NULL;

ALTER TABLE ai_calls ADD CONSTRAINT ai_calls_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE SET NULL;

ALTER TABLE ai_calls ADD CONSTRAINT ai_calls_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE SET NULL;

ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE;

ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE SET NULL;

ALTER TABLE sentence_evidence ADD CONSTRAINT sentence_evidence_inference_from_skill_id_inference_to_skill_id_fkey FOREIGN KEY (inference_from_skill_id, inference_to_skill_id) REFERENCES skill_inferences (from_skill_id, to_skill_id) ON DELETE CASCADE;

CREATE INDEX automation_excluded_companies_company_id_idx ON automation_excluded_companies (company_id);

CREATE INDEX skill_aliases_skill_id_idx ON skill_aliases (skill_id);

CREATE INDEX skill_relations_to_skill_id_idx ON skill_relations (to_skill_id);

CREATE INDEX skill_inferences_to_skill_id_idx ON skill_inferences (to_skill_id);

CREATE INDEX skill_inferences_via_skill_id_idx ON skill_inferences (via_skill_id);

CREATE INDEX course_skills_skill_id_idx ON course_skills (skill_id);

CREATE INDEX cvs_user_id_idx ON cvs (user_id);

CREATE INDEX cvs_target_location_id_idx ON cvs (target_location_id);

CREATE INDEX cv_fact_skills_skill_id_idx ON cv_fact_skills (skill_id);

CREATE INDEX attachments_user_id_idx ON attachments (user_id);

CREATE INDEX companies_industry_id_idx ON companies (industry_id);

CREATE INDEX job_postings_company_id_idx ON job_postings (company_id);

CREATE INDEX job_postings_location_id_idx ON job_postings (location_id);

CREATE INDEX job_postings_status_posted_at_idx ON job_postings (status, posted_at);

CREATE INDEX job_requirements_posting_id_idx ON job_requirements (posting_id);

CREATE INDEX job_requirements_skill_id_idx ON job_requirements (skill_id);

CREATE INDEX jd_insights_posting_id_idx ON jd_insights (posting_id);

CREATE INDEX market_snapshots_location_id_idx ON market_snapshots (location_id);

CREATE INDEX market_location_shares_location_id_idx ON market_location_shares (location_id);

CREATE INDEX market_skill_demand_skill_id_idx ON market_skill_demand (skill_id);

CREATE INDEX matches_posting_id_idx ON matches (posting_id);

CREATE INDEX matches_cv_id_chance_score_idx ON matches (cv_id, chance, score);

CREATE INDEX tailored_cvs_posting_id_idx ON tailored_cvs (posting_id);

CREATE INDEX tailored_attachments_attachment_id_idx ON tailored_attachments (attachment_id);

CREATE INDEX sentence_evidence_sentence_id_idx ON sentence_evidence (sentence_id);

CREATE INDEX sentence_evidence_fact_id_idx ON sentence_evidence (fact_id);

CREATE INDEX sentence_evidence_requirement_id_idx ON sentence_evidence (requirement_id);

CREATE INDEX sentence_evidence_inference_from_skill_id_inference_to_skill_id_idx ON sentence_evidence (inference_from_skill_id, inference_to_skill_id);

CREATE INDEX applications_user_id_submitted_at_idx ON applications (user_id, submitted_at);

CREATE INDEX applications_posting_id_idx ON applications (posting_id);

CREATE INDEX applications_tailored_cv_id_idx ON applications (tailored_cv_id);

CREATE INDEX mail_messages_application_id_idx ON mail_messages (application_id);

CREATE INDEX reply_drafts_application_id_idx ON reply_drafts (application_id);

CREATE INDEX reply_drafts_confirmed_by_idx ON reply_drafts (confirmed_by);

CREATE INDEX reply_drafts_sent_message_id_idx ON reply_drafts (sent_message_id);

CREATE INDEX ai_feedback_target_type_target_id_idx ON ai_feedback (target_type, target_id);

CREATE INDEX tasks_status_run_after_idx ON tasks (status, run_after);

CREATE INDEX tasks_user_id_idx ON tasks (user_id);

CREATE INDEX ai_calls_user_id_created_at_idx ON ai_calls (user_id, created_at);

CREATE INDEX ai_calls_task_id_idx ON ai_calls (task_id);

CREATE INDEX notifications_user_id_read_at_idx ON notifications (user_id, read_at);

CREATE INDEX audit_logs_user_id_created_at_idx ON audit_logs (user_id, created_at);

CREATE INDEX audit_logs_entity_type_entity_id_idx ON audit_logs (entity_type, entity_id);


CREATE UNIQUE INDEX cvs_one_primary_per_user ON cvs (user_id) WHERE is_primary;

ALTER TABLE automation_settings
  ADD CONSTRAINT automation_min_score_range CHECK (min_match_score BETWEEN 0 AND 100),
  ADD CONSTRAINT automation_daily_limit_range CHECK (daily_limit BETWEEN 1 AND 100),
  ADD CONSTRAINT automation_follow_up_days_range CHECK (follow_up_after_days BETWEEN 1 AND 30),
  ADD CONSTRAINT automation_max_follow_ups_range CHECK (max_follow_ups BETWEEN 0 AND 3);

ALTER TABLE system_settings
  ADD CONSTRAINT system_settings_single_row CHECK (id = 1),
  ADD CONSTRAINT system_settings_weights CHECK (
    weight_skill >= 0 AND weight_semantic >= 0 AND weight_experience >= 0 AND weight_location >= 0
    AND weight_skill + weight_semantic + weight_experience + weight_location > 0),
  ADD CONSTRAINT system_settings_chance CHECK (0 <= chance_medium_min AND chance_medium_min < chance_high_min AND chance_high_min <= 100),
  ADD CONSTRAINT system_settings_gate CHECK (skill_gate_cap BETWEEN 0 AND 100),
  ADD CONSTRAINT system_settings_depth CHECK (inference_max_depth BETWEEN 1 AND 5),
  ADD CONSTRAINT system_settings_reply CHECK (reply_confidence_min BETWEEN 0 AND 1);

ALTER TABLE skill_relations
  ADD CONSTRAINT skill_relations_no_self CHECK (from_skill_id <> to_skill_id);
ALTER TABLE skill_inferences
  ADD CONSTRAINT skill_inferences_depth CHECK (depth BETWEEN 1 AND 5),
  ADD CONSTRAINT skill_inferences_via CHECK ((depth = 1) = (via_skill_id IS NULL)),
  ADD CONSTRAINT skill_inferences_no_self CHECK (from_skill_id <> to_skill_id);

ALTER TABLE cv_facts
  ADD CONSTRAINT cv_facts_confidence CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  ADD CONSTRAINT cv_facts_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

ALTER TABLE job_postings
  ADD CONSTRAINT job_postings_salary CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min),
  ADD CONSTRAINT job_postings_email_channel CHECK (apply_channel <> 'EMAIL' OR apply_email IS NOT NULL);

ALTER TABLE job_requirements
  ADD CONSTRAINT job_requirements_quote CHECK (0 <= quote_start AND quote_start < quote_end);
ALTER TABLE jd_insights
  ADD CONSTRAINT jd_insights_quote CHECK (0 <= quote_start AND quote_start < quote_end);

ALTER TABLE matches
  ADD CONSTRAINT matches_score CHECK (score BETWEEN 0 AND 100),
  ADD CONSTRAINT matches_factors CHECK (
    factor_skill BETWEEN 0 AND 1 AND factor_semantic BETWEEN 0 AND 1
    AND factor_experience BETWEEN 0 AND 1 AND factor_location BETWEEN 0 AND 1);

ALTER TABLE sentence_evidence
  ADD CONSTRAINT sentence_evidence_one_target CHECK (
    (type = 'FACT' AND fact_id IS NOT NULL
       AND inference_from_skill_id IS NULL AND inference_to_skill_id IS NULL AND requirement_id IS NULL)
    OR (type = 'INFERENCE' AND inference_from_skill_id IS NOT NULL AND inference_to_skill_id IS NOT NULL
       AND fact_id IS NULL AND requirement_id IS NULL)
    OR (type = 'JD_REQUIREMENT' AND requirement_id IS NOT NULL
       AND fact_id IS NULL AND inference_from_skill_id IS NULL AND inference_to_skill_id IS NULL));

ALTER TABLE applications
  ADD CONSTRAINT applications_manual_reason CHECK (status <> 'MANUAL_REQUIRED' OR manual_reason IS NOT NULL),
  ADD CONSTRAINT applications_submitted_at CHECK (status IN ('QUEUED', 'MANUAL_REQUIRED', 'FAILED') OR submitted_at IS NOT NULL),
  ADD CONSTRAINT applications_follow_ups CHECK (follow_up_count >= 0);

ALTER TABLE mail_messages
  ADD CONSTRAINT mail_messages_class_inbound CHECK (direction = 'INBOUND' OR (class IS NULL AND corrected_class IS NULL)),
  ADD CONSTRAINT mail_messages_confidence CHECK (class_confidence IS NULL OR class_confidence BETWEEN 0 AND 1);

ALTER TABLE reply_drafts
  ADD CONSTRAINT reply_drafts_confirmed CHECK (
    status NOT IN ('CONFIRMED', 'SENT') OR (confirmed_by IS NOT NULL AND confirmed_at IS NOT NULL)),
  ADD CONSTRAINT reply_drafts_sent CHECK (status <> 'SENT' OR sent_message_id IS NOT NULL);

ALTER TABLE tasks
  ADD CONSTRAINT tasks_attempts CHECK (attempts >= 0 AND attempts <= max_attempts);

INSERT INTO system_settings DEFAULT VALUES;
