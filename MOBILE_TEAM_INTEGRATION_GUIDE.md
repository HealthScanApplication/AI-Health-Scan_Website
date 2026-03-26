# Code Registry Integration Guide - For Mobile Team 📱

**Share this with the mobile repository team**

---

## 🎯 What This Gives You

We've set up a **Code Registry System** in Supabase that automatically tracks all our web codebase changes. The mobile team can now:

✅ **Query database schemas** in real-time (no more guessing column names!)  
✅ **Check API contracts** before implementing features  
✅ **Get alerts on breaking changes** that affect mobile  
✅ **See TypeScript types** to create matching Dart classes  
✅ **Track shared utilities** across both repos  

---

## 🔑 Access Information

**Supabase Project:** `mofhvoudjxinvpplsytd`  
**URL:** `https://mofhvoudjxinvpplsytd.supabase.co`  

You'll need:
- **Anon Key** (for read-only queries) — Available in Supabase dashboard
- **Service Role Key** (if you want to sync mobile code back) — Contact web team

---

## 📊 Available Data

### Tables You Can Query:

| Table | What It Contains |
|-------|-----------------|
| `code_repositories` | Web and mobile repo metadata |
| `code_shared_schemas` | All Supabase table schemas (columns, types, RLS) |
| `code_modules` | Web utilities, components, types |
| `code_api_contracts` | REST/RPC endpoints with request/response schemas |
| `code_type_definitions` | TypeScript interfaces you might need in Dart |
| `code_sync_log` | History of what changed and when |
| `code_breaking_changes` | Alerts when web changes might break mobile |

---

## 🚀 Quick Start (Flutter/Dart)

### 1. Add Supabase to Your Project

```yaml
# pubspec.yaml
dependencies:
  supabase_flutter: ^2.0.0
```

### 2. Initialize in Your App

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  await Supabase.initialize(
    url: 'https://mofhvoudjxinvpplsytd.supabase.co',
    anonKey: 'YOUR_ANON_KEY_HERE', // Get from web team
  );
  
  runApp(MyApp());
}

final supabase = Supabase.instance.client;
```

### 3. Query the Registry

```dart
// Get all catalog table schemas
final schemas = await supabase
  .from('code_shared_schemas')
  .select()
  .eq('category', 'catalog');

print('Available tables: ${schemas.map((s) => s['schema_name']).toList()}');
```

---

## 💡 Common Use Cases

### ✅ Use Case 1: Check Table Schema Before Querying

**Problem:** You need to query `catalog_elements` but don't know the column names.

**Solution:**
```dart
final elementSchema = await supabase
  .from('code_shared_schemas')
  .select('schema_name, columns')
  .eq('schema_name', 'catalog_elements')
  .single();

final columns = elementSchema['columns'] as List;
print('Available columns:');
for (var col in columns) {
  print('- ${col['name']} (${col['type']})');
}
```

**Output:**
```
Available columns:
- id (uuid)
- name (text)
- element_key (text)
- type_label (text)
- health_role (text)
- image_url (text)
...
```

---

### ✅ Use Case 2: Verify API Endpoint Before Calling

**Problem:** You want to call `/admin/catalog/update` but need to know the request format.

**Solution:**
```dart
final endpoint = await supabase
  .from('code_api_contracts')
  .select()
  .eq('endpoint_path', '/functions/make-server-ed0fe4c2/admin/catalog/update')
  .single();

print('Method: ${endpoint['http_method']}');
print('Request schema: ${endpoint['request_schema']}');
print('Response schema: ${endpoint['response_schema']}');
print('Auth required: ${endpoint['authentication_required']}');
```

---

### ✅ Use Case 3: Get Breaking Change Alerts

**Problem:** Web team updated the database, did it break anything mobile uses?

**Solution:**
```dart
final breakingChanges = await supabase
  .from('code_breaking_changes')
  .select()
  .contains('affected_repos', ['healthscan-mobile'])
  .eq('resolution_status', 'unresolved')
  .order('detected_at', ascending: false);

if (breakingChanges.isNotEmpty) {
  print('⚠️ ${breakingChanges.length} breaking changes affecting mobile!');
  for (var change in breakingChanges) {
    print('- ${change['change_type']}: ${change['affected_entity']}');
    print('  Severity: ${change['severity']}');
    print('  Details: ${change['old_definition']} → ${change['new_definition']}');
  }
}
```

---

### ✅ Use Case 4: Generate Dart Model from TypeScript Type

**Problem:** Web has a `CatalogElement` TypeScript interface, you need the Dart equivalent.

**Solution:**
```dart
final typeDef = await supabase
  .from('code_type_definitions')
  .select('type_name, typescript_definition, json_schema')
  .eq('type_name', 'CatalogElement')
  .single();

// Use the JSON schema to generate Dart class
print(typeDef['typescript_definition']);
// Then manually create or use code generation tools
```

---

### ✅ Use Case 5: Monitor Web Repo Changes

**Problem:** Want to know when web team last synced and what changed.

**Solution:**
```dart
final latestSync = await supabase
  .from('code_sync_log')
  .select()
  .eq('repo_name', 'healthscan-web')
  .order('created_at', ascending: false)
  .limit(1)
  .single();

print('Last sync: ${latestSync['created_at']}');
print('Items updated: ${latestSync['items_updated']}');
print('Commit: ${latestSync['commit_sha']}');
```

---

## 🔄 Syncing Mobile Code Back (Optional)

If you want mobile code tracked too, you can create a similar sync script.

### 1. Create Sync Script

Create `scripts/sync_code_registry.dart` in your mobile repo:

```dart
import 'dart:io';
import 'package:supabase/supabase.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';

void main() async {
  final supabaseUrl = Platform.environment['SUPABASE_URL']!;
  final supabaseKey = Platform.environment['SUPABASE_SERVICE_KEY']!;
  
  final supabase = SupabaseClient(supabaseUrl, supabaseKey);
  
  // Update mobile repo metadata
  await supabase.from('code_repositories').upsert({
    'repo_name': 'healthscan-mobile',
    'repo_type': 'mobile',
    'package_manager': 'flutter',
    'framework': 'flutter',
    'language': 'dart',
    'last_sync_at': DateTime.now().toIso8601String(),
    'is_active': true,
  });
  
  print('✅ Synced mobile repo metadata');
  
  // TODO: Add logic to scan lib/ for Dart modules
  // TODO: Track Flutter widgets, services, models
}
```

### 2. Add GitHub Action

Create `.github/workflows/sync-code-registry.yml`:

```yaml
name: Sync Code Registry

on:
  push:
    branches: [main, develop]
    paths:
      - 'lib/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dart-lang/setup-dart@v1
      
      - name: Sync to code registry
        run: dart scripts/sync_code_registry.dart
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

### 3. Add Secrets to GitHub

In your mobile repo → Settings → Secrets:
- `SUPABASE_URL`: `https://mofhvoudjxinvpplsytd.supabase.co`
- `SUPABASE_SERVICE_KEY`: (get from web team)

---

## 🎨 Example: Create Dart Model from Registry

```dart
// Fetch schema for catalog_elements
final schema = await supabase
  .from('code_shared_schemas')
  .select('columns')
  .eq('schema_name', 'catalog_elements')
  .single();

// Generate Dart class (pseudo-code, adapt as needed)
class CatalogElement {
  final String id;
  final String name;
  final String? elementKey;
  final String? typeLabel;
  final String? healthRole;
  final String? imageUrl;
  
  CatalogElement({
    required this.id,
    required this.name,
    this.elementKey,
    this.typeLabel,
    this.healthRole,
    this.imageUrl,
  });
  
  factory CatalogElement.fromJson(Map<String, dynamic> json) {
    return CatalogElement(
      id: json['id'],
      name: json['name'],
      elementKey: json['element_key'],
      typeLabel: json['type_label'],
      healthRole: json['health_role'],
      imageUrl: json['image_url'],
    );
  }
}
```

---

## 📞 Communication Flow

### When Web Team Makes Changes:

1. Web dev commits schema/API change
2. GitHub Action auto-syncs to registry
3. You can query registry to see what changed
4. If breaking change, you'll see alert in `code_breaking_changes`

### When You Need Info:

1. Query registry tables (read-only, safe)
2. Check schemas before writing queries
3. Verify API contracts before making requests
4. Get latest type definitions

### When You Have Questions:

- Check `code_sync_log` to see what changed recently
- Look at `code_breaking_changes` for known issues
- Contact web team if something is unclear

---

## 🚨 Important Notes

### Schema Changes
- **Always check registry before assuming table structure**
- Web team can add/remove columns at any time
- Registry updates automatically on every web commit

### API Contracts
- Endpoint paths may change
- Request/response schemas evolve
- Check `status` field (active, deprecated, planned)

### Breaking Changes
- Monitor `code_breaking_changes` table regularly
- Mark changes as "resolved" after you update mobile code
- Severity levels: `critical`, `major`, `minor`

---

## 📚 Reference

### Key Catalog Tables in Registry:
- `catalog_elements` — Nutrients, compounds, etc.
- `catalog_ingredients` — Food items
- `catalog_recipes` — Meal recipes
- `catalog_products` — Store products
- `catalog_cooking_methods` — Cooking techniques
- `catalog_equipment` — Kitchen tools
- `hs_supplements` — Health scan supplements
- `hs_tests` — Health scan tests
- `hs_products` — Health scan products

### Junction Tables:
- `catalog_ingredient_elements` — Ingredients ↔ Elements
- `recipe_ingredients` — Recipes ↔ Ingredients
- `recipe_elements` — Recipes ↔ Elements
- `element_supplements` — Elements ↔ Supplements
- `element_tests` — Elements ↔ Tests

---

## 🎯 Next Steps for Mobile Team

1. **Get Access:**
   - Request `SUPABASE_URL` and `SUPABASE_ANON_KEY` from web team
   - Add to your environment config

2. **Test Queries:**
   - Try fetching `code_shared_schemas`
   - Check a few table schemas you currently use

3. **Monitor Changes:**
   - Query `code_sync_log` to see web team activity
   - Set up alerts for `code_breaking_changes`

4. **Optional - Sync Mobile Back:**
   - Create Dart sync script
   - Add GitHub Action
   - Share mobile code metadata with web team

---

## 💬 Questions?

Contact web team or check:
- Full docs: `CODE_REGISTRY_GUIDE.md` in web repo
- Migration file: `supabase/migrations/20260323_code_registry_system.sql`
- Sync script: `scripts/sync-code-registry.ts`

**Happy coding! 🚀**
