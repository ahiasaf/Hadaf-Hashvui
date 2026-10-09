CREATE TABLE IF NOT EXISTS migration_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_hash text NOT NULL UNIQUE,
  captured_at timestamptz NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  report jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS sheet_tables (
  name text PRIMARY KEY,
  headers jsonb NOT NULL CHECK (jsonb_typeof(headers) = 'array'),
  metadata jsonb NOT NULL,
  source_hash text NOT NULL,
  captured_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS sheet_rows (
  table_name text NOT NULL REFERENCES sheet_tables(name),
  ordinal integer NOT NULL CHECK (ordinal > 0),
  cells jsonb NOT NULL CHECK (jsonb_typeof(cells) = 'array'),
  PRIMARY KEY (table_name, ordinal)
);
CREATE TABLE IF NOT EXISTS people (
  id text PRIMARY KEY,
  school_code text NOT NULL,
  role text NOT NULL CHECK (role IN ('kid', 'dad')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  grade text NOT NULL,
  class_name text NOT NULL,
  is_test boolean NOT NULL,
  details jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS people_school_role ON people (school_code, role, is_test);
CREATE INDEX IF NOT EXISTS people_identity ON people (phone, first_name, last_name, role);
CREATE TABLE IF NOT EXISTS person_aliases (
  alias_id text PRIMARY KEY,
  person_id text NOT NULL REFERENCES people(id)
);
CREATE INDEX IF NOT EXISTS aliases_person ON person_aliases (person_id);
CREATE TABLE IF NOT EXISTS progress_events (
  source_row integer PRIMARY KEY,
  device_id text NOT NULL,
  track text NOT NULL,
  week integer NOT NULL CHECK (week > 0),
  is_complete boolean NOT NULL,
  fraction double precision NOT NULL CHECK (fraction >= 0 AND fraction <= 1),
  is_test boolean NOT NULL,
  details jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS progress_device_week ON progress_events (device_id, track, week);
CREATE OR REPLACE VIEW learning_progress AS
SELECT COALESCE(a.person_id, e.device_id) AS person_id,
       e.track, e.week, e.is_test,
       bool_or(e.is_complete) AS is_complete,
       CASE WHEN bool_or(e.is_complete) THEN 1 ELSE max(e.fraction) END AS fraction
FROM progress_events e
LEFT JOIN person_aliases a ON a.alias_id = e.device_id
GROUP BY COALESCE(a.person_id, e.device_id), e.track, e.week, e.is_test;
