# Admin Panel Fix Guide — Activities & Protocols Not Loading

## Problem
Activities and Protocols tabs show "No records found" in the admin panel.

## Root Cause
The migration file `20260326_create_catalog_protocols.sql` has been created but **not yet applied to your Supabase database**. This means:
- `catalog_activities` table exists but may be empty (seed data not applied)
- `catalog_protocols` table does not exist yet
- Both tabs fail to load data from the REST API

## Solution

### Step 1: Apply the Migration to Supabase

Run this command in your terminal:

```bash
cd /Users/john/05_Code/_AI-Health-Scan/_AI-Health-Scan_Website

supabase db push --project-ref mofhvoudjxinvpplsytd
```

This will:
1. Create the `catalog_protocols` table with all time-block fields
2. Re-seed `catalog_activities` with 15 activities if the table is empty
3. Seed 3 sample protocols (Detox Day, Recovery Day, Sleep Optimisation)

### Step 2: Verify the Migration Applied

Check the browser console (F12 → Console tab) when viewing the Activities or Protocols tabs. You should see:

✅ **Success logs:**
```
[Admin] Fetching activities from catalog_activities...
[Admin] ✅ Loaded 15 activities from catalog_activities
```

❌ **Error logs (if migration not applied):**
```
[Admin] ❌ Failed to fetch activities from catalog_activities: 404 Not Found
[Admin] ⚠️ Table "catalog_activities" not found. Did you apply the migration? Run: supabase db push
```

### Step 3: Refresh the Admin Panel

After applying the migration:
1. Refresh the browser (Cmd+R or Ctrl+R)
2. Navigate to Health Records → Activities
3. You should now see 15 activities listed
4. Navigate to Health Records → Protocols
5. You should now see 3 sample protocols listed

## Staging/Production Toggle

A new environment toggle has been added to the admin panel. You can now switch between:
- **🧪 Staging** — Development/testing environment
- **🚀 Production** — Live environment

To configure production environment:
1. Edit `src/utils/supabase/environments.ts`
2. Update the `production` environment config with your production Supabase credentials:
   ```typescript
   production: {
     projectId: 'YOUR_PRODUCTION_PROJECT_ID',
     publicAnonKey: 'YOUR_PRODUCTION_ANON_KEY',
     name: 'production',
     label: 'Production',
   },
   ```

## Enhanced Error Diagnostics

The `useAdminRecords` hook now provides detailed error messages:

- **404 Not Found** → Table doesn't exist (migration not applied)
- **401/403 Unauthorized** → Authentication/RLS policy issue
- **Empty array** → Table exists but has no data

Check the browser console for detailed logs when data fails to load.

## Files Modified

- `src/hooks/useAdminRecords.ts` — Enhanced error logging
- `src/utils/supabase/environments.ts` — New environment configuration
- `src/components/admin/EnvironmentToggle.tsx` — New toggle UI component
- `supabase/migrations/20260326_create_catalog_protocols.sql` — Migration file

## Next Steps

1. ✅ Run `supabase db push` to apply the migration
2. ✅ Refresh the admin panel
3. ✅ Verify Activities and Protocols load data
4. ⚪ (Optional) Configure production environment in `environments.ts`
5. ⚪ (Optional) Add environment toggle UI to admin panel header
