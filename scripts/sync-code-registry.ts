#!/usr/bin/env node
/**
 * ============================================================
 * CODE REGISTRY SYNC UTILITY
 * ============================================================
 * Extracts code metadata from this repo and syncs to Supabase
 * Enables cross-repo awareness between web and mobile codebases
 * 
 * Usage:
 *   npm run sync:code-registry
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/sync-code-registry.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

// ──────────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────────
const REPO_NAME = 'healthscan-web';
const REPO_ROOT = path.resolve(__dirname, '..');
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const API_BASE = `${SUPABASE_URL}/rest/v1`;
const HEADERS = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

// ──────────────────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────────────────
function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function getGitCommitInfo() {
  try {
    const sha = execSync('git rev-parse HEAD', { cwd: REPO_ROOT }).toString().trim();
    const message = execSync('git log -1 --pretty=%B', { cwd: REPO_ROOT }).toString().trim();
    return { sha, message };
  } catch {
    return { sha: 'unknown', message: 'unknown' };
  }
}

async function upsertToSupabase(table: string, data: any, conflictColumns: string[]) {
  const url = `${API_BASE}/${table}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': `resolution=merge-duplicates,return=minimal` },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upsert to ${table}: ${response.status} ${error}`);
  }
}

async function createSyncLog(repoId: string, syncType: string) {
  const logId = crypto.randomUUID();
  await upsertToSupabase('code_sync_log', {
    id: logId,
    repo_id: repoId,
    sync_type: syncType,
    sync_direction: 'push',
    sync_status: 'in_progress',
    triggered_by: process.env.GITHUB_ACTIONS ? 'github_action' : 'manual',
  }, ['id']);
  return logId;
}

async function updateSyncLog(logId: string, updates: any) {
  const url = `${API_BASE}/code_sync_log?id=eq.${logId}`;
  await fetch(url, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
  });
}

// ──────────────────────────────────────────────────────────
// REPO METADATA
// ──────────────────────────────────────────────────────────
async function syncRepoMetadata() {
  const { sha, message } = getGitCommitInfo();
  const packageJson = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8'));
  
  const repoData = {
    repo_name: REPO_NAME,
    repo_type: 'web',
    github_url: packageJson.repository?.url || 'https://github.com/yourusername/AI-Health-Scan_Website',
    package_manager: 'npm',
    framework: 'react',
    language: 'typescript',
    last_sync_at: new Date().toISOString(),
    last_commit_sha: sha,
    last_commit_message: message,
    is_active: true,
    metadata: {
      version: packageJson.version,
      dependencies: Object.keys(packageJson.dependencies || {}),
    },
  };

  await upsertToSupabase('code_repositories', repoData, ['repo_name']);
  console.log('✅ Synced repo metadata');
  
  // Fetch repo ID
  const res = await fetch(`${API_BASE}/code_repositories?repo_name=eq.${REPO_NAME}&select=id`, {
    headers: HEADERS,
  });
  const repos = await res.json();
  return repos[0]?.id;
}

// ──────────────────────────────────────────────────────────
// SHARED SCHEMAS (from migrations)
// ──────────────────────────────────────────────────────────
async function syncSharedSchemas() {
  const migrationsDir = path.join(REPO_ROOT, 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('⚠️  No migrations directory found, skipping schemas');
    return 0;
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  const schemas: any[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const tableMatches = content.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/gi);
    
    for (const match of tableMatches) {
      const tableName = match[1];
      const category = 
        tableName.startsWith('catalog_') ? 'catalog' :
        tableName.startsWith('hs_') ? 'healthscan' :
        tableName.includes('_') && !tableName.startsWith('code_') ? 'junction' : 'other';
      
      schemas.push({
        schema_name: tableName,
        schema_type: 'table',
        category,
        definition_hash: hashContent(content),
        source_migration: file,
        is_synced: true,
        last_verified_at: new Date().toISOString(),
      });
    }
  }

  for (const schema of schemas) {
    await upsertToSupabase('code_shared_schemas', schema, ['schema_name', 'schema_type']);
  }

  console.log(`✅ Synced ${schemas.length} schemas`);
  return schemas.length;
}

// ──────────────────────────────────────────────────────────
// CODE MODULES (utilities, components, types)
// ──────────────────────────────────────────────────────────
function findModules(dir: string, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']): string[] {
  let results: string[] = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'build', 'dist'].includes(item)) {
        results = results.concat(findModules(fullPath, extensions));
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  
  return results;
}

function extractExports(content: string): any[] {
  const exports: any[] = [];
  const exportMatches = content.matchAll(/export (?:const|function|class|interface|type|enum) (\w+)/g);
  for (const match of exportMatches) {
    exports.push({ name: match[1], type: 'named' });
  }
  const defaultMatch = content.match(/export default (\w+)/);
  if (defaultMatch) {
    exports.push({ name: defaultMatch[1], type: 'default' });
  }
  return exports;
}

async function syncCodeModules(repoId: string) {
  const srcDir = path.join(REPO_ROOT, 'src');
  if (!fs.existsSync(srcDir)) {
    console.log('⚠️  No src directory found, skipping modules');
    return 0;
  }

  const modulePaths = findModules(srcDir);
  const sharedDirs = ['utils', 'config', 'types'];
  let count = 0;

  for (const modulePath of modulePaths) {
    const relativePath = path.relative(REPO_ROOT, modulePath);
    const content = fs.readFileSync(modulePath, 'utf-8');
    const moduleName = path.basename(modulePath, path.extname(modulePath));
    const isShared = sharedDirs.some(dir => relativePath.includes(`/${dir}/`));
    
    const moduleType =
      relativePath.includes('/components/') ? 'component' :
      relativePath.includes('/utils/') ? 'utility' :
      relativePath.includes('/config/') ? 'config' :
      relativePath.includes('/types/') ? 'type' :
      relativePath.includes('/hooks/') ? 'hook' : 'other';

    const moduleData = {
      repo_id: repoId,
      module_path: relativePath,
      module_name: moduleName,
      module_type: moduleType,
      language: modulePath.endsWith('.ts') || modulePath.endsWith('.tsx') ? 'typescript' : 'javascript',
      exports: extractExports(content),
      code_hash: hashContent(content),
      line_count: content.split('\n').length,
      is_shared: isShared,
      last_modified_at: fs.statSync(modulePath).mtime.toISOString(),
    };

    await upsertToSupabase('code_modules', moduleData, ['repo_id', 'module_path']);
    count++;
  }

  console.log(`✅ Synced ${count} code modules`);
  return count;
}

// ──────────────────────────────────────────────────────────
// API CONTRACTS (edge functions, endpoints)
// ──────────────────────────────────────────────────────────
async function syncApiContracts() {
  const edgeFunctionsDir = path.join(REPO_ROOT, 'supabase', 'functions');
  if (!fs.existsSync(edgeFunctionsDir)) {
    console.log('⚠️  No edge functions directory, skipping API contracts');
    return 0;
  }

  const functionDirs = fs.readdirSync(edgeFunctionsDir).filter(f => {
    const stat = fs.statSync(path.join(edgeFunctionsDir, f));
    return stat.isDirectory();
  });

  const contracts: any[] = [];
  
  for (const funcDir of functionDirs) {
    const indexPath = path.join(edgeFunctionsDir, funcDir, 'index.tsx');
    if (!fs.existsSync(indexPath)) continue;
    
    const content = fs.readFileSync(indexPath, 'utf-8');
    const routeMatches = content.matchAll(/app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/gi);
    
    for (const match of routeMatches) {
      const method = match[1].toUpperCase();
      const path = match[2];
      
      contracts.push({
        endpoint_path: `/functions/${funcDir}${path}`,
        http_method: method,
        endpoint_type: 'edge_function',
        description: `Edge function: ${funcDir}`,
        authentication_required: true,
        implemented_in: ['web'],
        source_file: `supabase/functions/${funcDir}/index.tsx`,
        status: 'active',
        version: '1.0',
        last_verified_at: new Date().toISOString(),
      });
    }
  }

  for (const contract of contracts) {
    await upsertToSupabase('code_api_contracts', contract, ['endpoint_path', 'http_method']);
  }

  console.log(`✅ Synced ${contracts.length} API contracts`);
  return contracts.length;
}

// ──────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ──────────────────────────────────────────────────────────
async function syncTypeDefinitions() {
  const typesDir = path.join(REPO_ROOT, 'src', 'types');
  if (!fs.existsSync(typesDir)) {
    console.log('⚠️  No types directory, skipping type definitions');
    return 0;
  }

  const typeFiles = fs.readdirSync(typesDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
  const types: any[] = [];

  for (const file of typeFiles) {
    const content = fs.readFileSync(path.join(typesDir, file), 'utf-8');
    const interfaceMatches = content.matchAll(/export interface (\w+)/g);
    const typeMatches = content.matchAll(/export type (\w+)/g);
    
    for (const match of interfaceMatches) {
      types.push({
        type_name: match[1],
        type_category: 'interface',
        typescript_definition: content,
        is_synced: true,
      });
    }
    
    for (const match of typeMatches) {
      types.push({
        type_name: match[1],
        type_category: 'type_alias',
        typescript_definition: content,
        is_synced: true,
      });
    }
  }

  for (const type of types) {
    await upsertToSupabase('code_type_definitions', type, ['type_name']);
  }

  console.log(`✅ Synced ${types.length} type definitions`);
  return types.length;
}

// ──────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting code registry sync...\n');
  const startTime = Date.now();
  
  try {
    // 1. Sync repo metadata and get repo ID
    const repoId = await syncRepoMetadata();
    if (!repoId) throw new Error('Failed to get repo ID');
    
    // 2. Create sync log
    const logId = await createSyncLog(repoId, 'full');
    
    // 3. Sync all components
    const schemasCount = await syncSharedSchemas();
    const modulesCount = await syncCodeModules(repoId);
    const contractsCount = await syncApiContracts();
    const typesCount = await syncTypeDefinitions();
    
    const totalItems = schemasCount + modulesCount + contractsCount + typesCount;
    const duration = Date.now() - startTime;
    
    // 4. Update sync log
    await updateSyncLog(logId, {
      sync_status: 'completed',
      items_synced: totalItems,
      items_added: totalItems,
      duration_ms: duration,
    });
    
    console.log(`\n✅ Sync completed in ${duration}ms`);
    console.log(`   Schemas: ${schemasCount}`);
    console.log(`   Modules: ${modulesCount}`);
    console.log(`   API Contracts: ${contractsCount}`);
    console.log(`   Types: ${typesCount}`);
    console.log(`   Total: ${totalItems} items\n`);
    
  } catch (error: any) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

main();
