DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='portfolio_public') THEN CREATE ROLE portfolio_public LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='portfolio_owner') THEN CREATE ROLE portfolio_owner LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='portfolio_auth') THEN CREATE ROLE portfolio_auth LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS; END IF;
END $$;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO portfolio_public,portfolio_owner,portfolio_auth;
CREATE TABLE documents (key text PRIMARY KEY CHECK(key IN ('profile','settings')), data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, status text NOT NULL CHECK(status IN ('draft','published','archived')), data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX projects_published_idx ON projects(status,slug);
CREATE TABLE records (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL CHECK(kind IN ('skill','certification')), visible boolean NOT NULL DEFAULT false, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE media (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), filename text NOT NULL, mime text NOT NULL, size integer NOT NULL, width integer, height integer, alt text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text NOT NULL, type text NOT NULL, message text NOT NULL, budget text NOT NULL DEFAULT '', timeline text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'unread' CHECK(status IN ('unread','read','archived','spam')), notification text NOT NULL DEFAULT 'not_configured', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE owners (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE, password_hash text NOT NULL, CHECK(id='00000000-0000-4000-8000-000000000001'::uuid));
CREATE TABLE sessions (token_hash text PRIMARY KEY, owner_id uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE TABLE rate_limits (key text PRIMARY KEY, count integer NOT NULL, reset_at timestamptz NOT NULL);
CREATE TABLE revisions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,data jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),action text NOT NULL,entity_id text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['documents','projects','records','media','messages','owners','sessions','rate_limits','revisions','audit_logs'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['documents','projects','records','media','messages','revisions','audit_logs'] LOOP
    EXECUTE format('CREATE POLICY owner_all ON %I TO portfolio_owner USING (true) WITH CHECK (true)',t);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON %I TO portfolio_owner',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['owners','sessions','rate_limits'] LOOP
    EXECUTE format('CREATE POLICY auth_all ON %I TO portfolio_auth USING (true) WITH CHECK (true)',t);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON %I TO portfolio_auth',t);
  END LOOP;
END $$;
CREATE POLICY public_documents ON documents FOR SELECT TO portfolio_public USING(true);
CREATE POLICY public_projects ON projects FOR SELECT TO portfolio_public USING(status='published');
CREATE POLICY public_records ON records FOR SELECT TO portfolio_public USING(visible);
CREATE POLICY public_media ON media FOR SELECT TO portfolio_public USING(
  EXISTS (SELECT 1 FROM documents d WHERE d.data::text LIKE '%' || media.id::text || '%') OR
  EXISTS (SELECT 1 FROM projects p WHERE p.status='published' AND p.data::text LIKE '%' || media.id::text || '%') OR
  EXISTS (SELECT 1 FROM records r WHERE r.visible AND r.data::text LIKE '%' || media.id::text || '%')
);
GRANT SELECT ON documents,projects,records,media TO portfolio_public;
-- Contact writes are server-side owner operations after validation/rate limiting;
-- the public connection has no mutation grants and cannot read messages.
