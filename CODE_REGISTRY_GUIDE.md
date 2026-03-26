# Code Registry System - Web ↔ Mobile Sync

## 🎯 Overview

The **Code Registry System** creates bidirectional code awareness between the **Web** and **Mobile** GitHub repositories using **Supabase** as the shared registry. This enables:

- 📊 Real-time tracking of database schemas, API contracts, and type definitions
- 🔄 Automatic sync on every push via GitHub Actions
- 🚨 Breaking change detection when schemas/APIs diverge
- 📦 Module and utility tracking across repositories
- 🎨 Cross-platform type consistency (TypeScript ↔ Dart)

---

## 📁 Architecture

```
┌──────────────────┐         ┌──────────────────┐
│  Web Repo        │         │  Mobile Repo     │
│  (TypeScript)    │         │  (Flutter/Dart)  │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │   Push metadata on commit │
         │                            │
         ▼                            ▼
    ┌────────────────────────────────────┐
    │       SUPABASE REGISTRY            │
    │  ─────────────────────────────────│
    │  • code_repositories               │
    │  • code_shared_schemas             │
    │  • code_modules                    │
    │  • code_api_contracts              │
    │  • code_type_definitions           │
    │  • code_sync_log                   │
    │  • code_breaking_changes           │
    └────────────────────────────────────┘
         ▲                            ▲
         │   Query for changes        │
         │                            │
         │                            │
    Web CI/CD                    Mobile CI/CD
```

---

## 🗄️ Database Schema

### 1. **code_repositories**
Tracks connected repositories (web, mobile, API)
- `repo_name`, `repo_type`, `github_url`
- `last_commit_sha`, `last_sync_at`
- `framework`, `language`, `package_manager`

### 2. **code_shared_schemas**
Supabase table schemas shared across repos
- `schema_name` (e.g., `catalog_elements`)
- `columns`, `indexes`, `foreign_keys`, `rls_policies`
- `typescript_interface`, `dart_class`
- `definition_hash` for change detection

### 3. **code_modules**
Code modules (utils, components, types) per repo
- `module_path`, `module_name`, `module_type`
- `exports`, `imports`, `dependencies`
- `code_hash` for change detection
- `equivalent_modules` — links to mobile equivalent

### 4. **code_api_contracts**
REST/RPC API endpoints and contracts
- `endpoint_path`, `http_method`
- `request_schema`, `response_schema`
- `implemented_in` (web, mobile, edge_function)

### 5. **code_type_definitions**
Shared TypeScript/Dart types
- `type_name`, `typescript_definition`, `dart_definition`
- `json_schema`, `related_schema`

### 6. **code_sync_log**
History of sync operations
- `sync_type`, `sync_status`, `items_synced`
- `triggered_by`, `duration_ms`

### 7. **code_breaking_changes**
Detected breaking changes
- `change_type`, `severity`, `affected_entity`
- `old_definition`, `new_definition`
- `affected_repos`, `resolution_status`

---

## 🚀 Setup

### 1. Run Migration

```bash
cd /Users/john/05_Code/_AI-Health-Scan/_AI-Health-Scan_Website

# Apply migration to staging/development
supabase db push --project-ref mofhvoudjxinvpplsytd \
  --workdir /Users/john/05_Code/_AI-Health-Scan/_AI-Health-Scan_Website

# Or run SQL directly in Supabase dashboard
```

### 2. Install Dependencies

```bash
npm install tsx --save-dev
```

### 3. Set Environment Variables

Add to `.env` or GitHub Secrets:

```bash
SUPABASE_URL=https://mofhvoudjxinvpplsytd.supabase.co
SUPABASE_SERVICE_KEY=<your-service-role-key>
```

### 4. Configure GitHub Actions Secrets

In your GitHub repo settings → Secrets and variables → Actions:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

---

## 📤 Usage

### Manual Sync (Web Repo)

```bash
npm run sync:code-registry
```

This will:
1. ✅ Extract repo metadata (commit SHA, package.json)
2. ✅ Parse all migration files for table schemas
3. ✅ Scan `src/` for code modules (utils, components, types)
4. ✅ Extract API endpoints from edge functions
5. ✅ Catalog TypeScript type definitions
6. ✅ Push all metadata to Supabase registry

### Automatic Sync via GitHub Actions

The workflow `.github/workflows/sync-code-registry.yml` runs automatically on:
- Every push to `main` or `develop`
- Changes to `src/`, `supabase/migrations/`, or `supabase/functions/`
- Manual trigger via GitHub UI

### Query from Mobile Repo

The mobile team can query the registry to:

**Get latest schema definitions:**
```dart
final response = await supabase
  .from('code_shared_schemas')
  .select()
  .eq('category', 'catalog');
```

**Check for API contract changes:**
```dart
final response = await supabase
  .from('code_api_contracts')
  .select()
  .eq('status', 'active');
```

**Detect breaking changes:**
```dart
final response = await supabase
  .from('code_breaking_changes')
  .select()
  .eq('resolution_status', 'unresolved')
  .order('detected_at', ascending: false);
```

---

## 🔄 Workflow Example

### Scenario: Web adds new column to `catalog_elements`

1. **Developer updates migration:**
   ```sql
   ALTER TABLE catalog_elements ADD COLUMN new_field TEXT;
   ```

2. **Commit & push to `main`:**
   ```bash
   git add supabase/migrations/20260323_add_new_field.sql
   git commit -m "Add new_field to catalog_elements"
   git push origin main
   ```

3. **GitHub Action triggers:**
   - ✅ Syncs updated schema to `code_shared_schemas`
   - ✅ Detects column addition
   - ✅ Logs change in `code_sync_log`
   - ⚠️ **Creates breaking change alert** if mobile uses this table

4. **Mobile team is notified:**
   - Queries `code_breaking_changes` table
   - Sees `catalog_elements` schema changed
   - Updates Dart models accordingly
   - Marks change as "resolved"

---

## 🛠️ Extending for Mobile Repo

### Create Mobile Sync Script

Create `scripts/sync-code-registry.dart` in mobile repo:

```dart
import 'dart:io';
import 'package:supabase/supabase.dart';
import 'package:crypto/crypto.dart';

void main() async {
  final supabase = SupabaseClient(
    Platform.environment['SUPABASE_URL']!,
    Platform.environment['SUPABASE_SERVICE_KEY']!,
  );

  // Get repo ID
  final repos = await supabase
    .from('code_repositories')
    .select()
    .eq('repo_name', 'healthscan-mobile');
  
  final repoId = repos[0]['id'];

  // Sync Dart modules, models, etc.
  // Similar logic to TypeScript sync script
}
```

### Add to Mobile CI/CD

```yaml
# .github/workflows/sync-code-registry.yml
name: Sync Code Registry
on:
  push:
    branches: [main, develop]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dart-lang/setup-dart@v1
      - run: dart scripts/sync-code-registry.dart
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

---

## 🎯 Use Cases

### 1. **Schema Consistency Check**
Before deploying mobile app, verify it's compatible with current DB schema:
```dart
final schemas = await supabase.from('code_shared_schemas').select();
// Compare local Dart models against registry schemas
```

### 2. **API Contract Verification**
Ensure mobile app uses correct API endpoints:
```dart
final contracts = await supabase
  .from('code_api_contracts')
  .select()
  .contains('implemented_in', ['mobile']);
```

### 3. **Type Definition Sync**
Generate Dart classes from TypeScript interfaces:
```dart
final types = await supabase
  .from('code_type_definitions')
  .select('type_name, typescript_definition');
// Auto-generate equivalent Dart classes
```

### 4. **Breaking Change Alerts**
Get notified when web changes impact mobile:
```dart
final breaking = await supabase
  .from('code_breaking_changes')
  .select()
  .in_('affected_repos', ['healthscan-mobile'])
  .eq('resolution_status', 'unresolved');

if (breaking.isNotEmpty) {
  print('⚠️ ${breaking.length} unresolved breaking changes!');
}
```

---

## 📊 Monitoring & Maintenance

### View Sync History
```sql
SELECT * FROM code_sync_log 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check for Drift
```sql
SELECT 
  s.schema_name,
  s.definition_hash,
  s.last_verified_at
FROM code_shared_schemas s
WHERE s.is_synced = false
   OR s.last_verified_at < NOW() - INTERVAL '7 days';
```

### Review Breaking Changes
```sql
SELECT * FROM code_breaking_changes
WHERE resolution_status = 'unresolved'
ORDER BY severity DESC, detected_at DESC;
```

---

## 🚨 Troubleshooting

**Sync fails with 401:**
- Check `SUPABASE_SERVICE_KEY` is correct (not anon key)
- Verify RLS policies allow service role writes

**No schemas detected:**
- Ensure `supabase/migrations/` exists
- Check file names end in `.sql`

**Breaking changes not detected:**
- Manual verification still required for complex changes
- Current implementation detects schema additions/removals
- Future: Add semantic diff analysis

---

## 🔮 Future Enhancements

- [ ] Semantic diff analysis for API contracts
- [ ] Auto-generate Dart models from TypeScript interfaces
- [ ] Slack/Discord notifications for breaking changes
- [ ] Visual dashboard for cross-repo dependency graph
- [ ] Pre-commit hooks to prevent breaking changes
- [ ] Version tagging for schema compatibility matrix

---

## 📝 Notes

- **Service Role Key Required**: Sync script uses service role for write access
- **RLS Enabled**: All tables use RLS; service role bypasses for automation
- **Change Detection**: Uses SHA-256 hashing of content for fast drift detection
- **Idempotent**: Safe to run multiple times; uses upsert logic

---

## 🤝 Team Collaboration

**Web Team:**
1. Update schemas/types/APIs as needed
2. Commit & push (auto-sync runs)
3. Review breaking changes in Supabase dashboard

**Mobile Team:**
1. Query registry before major changes
2. Pull latest schemas/contracts
3. Mark breaking changes as resolved after updates

**Both Teams:**
- Use `code_sync_log` to track who changed what
- Document breaking changes with resolution notes
- Keep `equivalent_modules` mapping updated
