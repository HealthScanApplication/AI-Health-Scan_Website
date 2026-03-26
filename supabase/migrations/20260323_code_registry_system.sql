/**
 * ============================================================
 * CODE REGISTRY SYSTEM
 * ============================================================
 * Cross-repository code awareness for Web ↔ Mobile sync
 * Tracks shared schemas, types, API contracts, and code modules
 * between separate GitHub repositories using Supabase as registry
 */

-- ────────────────────────────────────────────────────────────
-- 1. REPOSITORIES TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS code_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_name TEXT NOT NULL UNIQUE, -- e.g., 'healthscan-web', 'healthscan-mobile'
  repo_type TEXT NOT NULL, -- 'web', 'mobile', 'api', 'shared'
  github_url TEXT,
  default_branch TEXT DEFAULT 'main',
  last_sync_at TIMESTAMPTZ,
  last_commit_sha TEXT,
  last_commit_message TEXT,
  package_manager TEXT, -- 'npm', 'yarn', 'pnpm', 'flutter', 'dart'
  framework TEXT, -- 'react', 'nextjs', 'flutter', 'react-native'
  language TEXT, -- 'typescript', 'javascript', 'dart'
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_repos_type ON code_repositories(repo_type);
CREATE INDEX IF NOT EXISTS idx_code_repos_active ON code_repositories(is_active);

-- ────────────────────────────────────────────────────────────
-- 2. SHARED SCHEMAS (Database Tables, Supabase Tables)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS code_shared_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_name TEXT NOT NULL, -- table name, e.g., 'catalog_elements'
  schema_type TEXT NOT NULL, -- 'table', 'view', 'function', 'rpc'
  category TEXT, -- 'catalog', 'healthscan', 'junction', 'user'
  definition_hash TEXT, -- MD5/SHA256 of schema definition for change detection
  columns JSONB, -- [{name, type, nullable, default, description}]
  indexes JSONB, -- [{name, columns[], type}]
  foreign_keys JSONB, -- [{column, references_table, references_column}]
  rls_policies JSONB, -- [{name, operation, using, check}]
  sample_query TEXT, -- Example query for this schema
  typescript_interface TEXT, -- Generated TS interface
  dart_class TEXT, -- Generated Dart class
  source_migration TEXT, -- Which migration file created this
  is_synced BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schema_name, schema_type)
);

CREATE INDEX IF NOT EXISTS idx_shared_schemas_name ON code_shared_schemas(schema_name);
CREATE INDEX IF NOT EXISTS idx_shared_schemas_type ON code_shared_schemas(schema_type);
CREATE INDEX IF NOT EXISTS idx_shared_schemas_category ON code_shared_schemas(category);
CREATE INDEX IF NOT EXISTS idx_shared_schemas_synced ON code_shared_schemas(is_synced);

-- ────────────────────────────────────────────────────────────
-- 3. CODE MODULES (Shared utilities, helpers, types)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS code_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES code_repositories(id) ON DELETE CASCADE,
  module_path TEXT NOT NULL, -- e.g., 'src/utils/adminHelpers.ts'
  module_name TEXT NOT NULL, -- e.g., 'adminHelpers'
  module_type TEXT NOT NULL, -- 'utility', 'component', 'type', 'hook', 'config', 'service'
  language TEXT, -- 'typescript', 'dart', 'javascript'
  exports JSONB, -- [{name, type, signature, description}]
  imports JSONB, -- [{from, imports[]}]
  dependencies TEXT[], -- External package dependencies
  code_hash TEXT, -- Hash of file content for change detection
  line_count INTEGER,
  last_modified_at TIMESTAMPTZ,
  last_commit_sha TEXT,
  is_shared BOOLEAN DEFAULT false, -- Is this meant to be shared across repos?
  equivalent_modules JSONB, -- [{repo_name, module_path, sync_status}] for cross-repo equivalents
  documentation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(repo_id, module_path)
);

CREATE INDEX IF NOT EXISTS idx_code_modules_repo ON code_modules(repo_id);
CREATE INDEX IF NOT EXISTS idx_code_modules_type ON code_modules(module_type);
CREATE INDEX IF NOT EXISTS idx_code_modules_shared ON code_modules(is_shared);
CREATE INDEX IF NOT EXISTS idx_code_modules_hash ON code_modules(code_hash);

-- ────────────────────────────────────────────────────────────
-- 4. API CONTRACTS (REST/RPC endpoints)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS code_api_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_path TEXT NOT NULL, -- e.g., '/admin/catalog/update'
  http_method TEXT, -- 'GET', 'POST', 'PUT', 'DELETE', 'RPC'
  endpoint_type TEXT NOT NULL, -- 'rest', 'rpc', 'edge_function'
  description TEXT,
  request_schema JSONB, -- {headers, params, body: {type, schema}}
  response_schema JSONB, -- {success: {type, schema}, error: {type, schema}}
  authentication_required BOOLEAN DEFAULT true,
  rate_limit TEXT,
  implemented_in TEXT[], -- ['web', 'mobile', 'edge_function']
  source_file TEXT, -- File that implements this endpoint
  example_request TEXT,
  example_response TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'deprecated', 'planned'
  version TEXT DEFAULT '1.0',
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(endpoint_path, http_method)
);

CREATE INDEX IF NOT EXISTS idx_api_contracts_path ON code_api_contracts(endpoint_path);
CREATE INDEX IF NOT EXISTS idx_api_contracts_type ON code_api_contracts(endpoint_type);
CREATE INDEX IF NOT EXISTS idx_api_contracts_status ON code_api_contracts(status);

-- ────────────────────────────────────────────────────────────
-- 5. TYPE DEFINITIONS (Shared interfaces/types)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS code_type_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name TEXT NOT NULL UNIQUE,
  type_category TEXT, -- 'model', 'dto', 'enum', 'interface', 'type_alias'
  typescript_definition TEXT,
  dart_definition TEXT,
  json_schema JSONB,
  related_schema TEXT, -- References code_shared_schemas.schema_name if DB-backed
  usage_locations JSONB, -- [{repo, file_path, line_number}]
  is_synced BOOLEAN DEFAULT false,
  validation_rules JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_type_defs_name ON code_type_definitions(type_name);
CREATE INDEX IF NOT EXISTS idx_type_defs_category ON code_type_definitions(type_category);
CREATE INDEX IF NOT EXISTS idx_type_defs_schema ON code_type_definitions(related_schema);

-- ────────────────────────────────────────────────────────────
-- 6. SYNC LOG (Track sync events)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS code_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES code_repositories(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'schema_only', 'types_only'
  sync_direction TEXT, -- 'push', 'pull', 'bidirectional'
  items_synced INTEGER DEFAULT 0,
  items_added INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_deleted INTEGER DEFAULT 0,
  sync_status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
  error_message TEXT,
  commit_sha TEXT,
  triggered_by TEXT, -- 'github_action', 'manual', 'cron'
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_repo ON code_sync_log(repo_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON code_sync_log(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_log_created ON code_sync_log(created_at DESC);

-- ────────────────────────────────────────────────────────────
-- 7. BREAKING CHANGES ALERTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS code_breaking_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_type TEXT NOT NULL, -- 'schema_column_removed', 'api_endpoint_changed', 'type_signature_changed'
  severity TEXT NOT NULL, -- 'critical', 'major', 'minor'
  affected_entity TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'schema', 'api', 'type', 'module'
  old_definition JSONB,
  new_definition JSONB,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  detected_in_repo TEXT,
  affected_repos TEXT[],
  resolution_status TEXT DEFAULT 'unresolved', -- 'unresolved', 'acknowledged', 'resolved', 'ignored'
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_breaking_changes_type ON code_breaking_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_breaking_changes_severity ON code_breaking_changes(severity);
CREATE INDEX IF NOT EXISTS idx_breaking_changes_status ON code_breaking_changes(resolution_status);

-- ────────────────────────────────────────────────────────────
-- RLS POLICIES (Enable public read, authenticated write)
-- ────────────────────────────────────────────────────────────
ALTER TABLE code_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_shared_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_api_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_type_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_breaking_changes ENABLE ROW LEVEL SECURITY;

-- Read access for all (GitHub Actions, CI/CD can read)
CREATE POLICY "code_repositories_read" ON code_repositories FOR SELECT USING (true);
CREATE POLICY "code_shared_schemas_read" ON code_shared_schemas FOR SELECT USING (true);
CREATE POLICY "code_modules_read" ON code_modules FOR SELECT USING (true);
CREATE POLICY "code_api_contracts_read" ON code_api_contracts FOR SELECT USING (true);
CREATE POLICY "code_type_definitions_read" ON code_type_definitions FOR SELECT USING (true);
CREATE POLICY "code_sync_log_read" ON code_sync_log FOR SELECT USING (true);
CREATE POLICY "code_breaking_changes_read" ON code_breaking_changes FOR SELECT USING (true);

-- Write access for authenticated users (service role for GitHub Actions)
CREATE POLICY "code_repositories_write" ON code_repositories FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "code_shared_schemas_write" ON code_shared_schemas FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "code_modules_write" ON code_modules FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "code_api_contracts_write" ON code_api_contracts FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "code_type_definitions_write" ON code_type_definitions FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "code_sync_log_write" ON code_sync_log FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "code_breaking_changes_write" ON code_breaking_changes FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────────
-- SEED DATA: Register web and mobile repos
-- ────────────────────────────────────────────────────────────
INSERT INTO code_repositories (repo_name, repo_type, github_url, package_manager, framework, language) VALUES
  ('healthscan-web', 'web', 'https://github.com/yourusername/AI-Health-Scan_Website', 'npm', 'react', 'typescript'),
  ('healthscan-mobile', 'mobile', 'https://github.com/yourusername/healthscan-mobile', 'flutter', 'flutter', 'dart')
ON CONFLICT (repo_name) DO NOTHING;

COMMENT ON TABLE code_repositories IS 'Registry of connected repositories (web, mobile, API)';
COMMENT ON TABLE code_shared_schemas IS 'Supabase table schemas shared across repos';
COMMENT ON TABLE code_modules IS 'Code modules (utils, components, types) tracked per repo';
COMMENT ON TABLE code_api_contracts IS 'REST/RPC API endpoints and their contracts';
COMMENT ON TABLE code_type_definitions IS 'Shared TypeScript/Dart type definitions';
COMMENT ON TABLE code_sync_log IS 'History of code sync operations';
COMMENT ON TABLE code_breaking_changes IS 'Detected breaking changes requiring cross-repo updates';
