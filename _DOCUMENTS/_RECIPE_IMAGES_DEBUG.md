# Recipe Images Not Showing - Debugging Guide

## Issue
Recipe images are not displaying in the admin panel recipes tab.

## Diagnostic Steps

### 1. Check Browser Console
When you open admin panel and click on **Recipes** tab, check browser console (F12 → Console) for:

**Look for these logs:**
```
🖼️ Recipe images debug: [
  { id: '...', name: '...', image_url: '...', has_image: true/false },
  ...
]
```

**What to check:**
- Are `image_url` values present? (should not be null/undefined)
- Are they valid URLs? (should start with http:// or https://)
- Is `has_image` true or false?

### 2. Possible Issues & Solutions

#### Issue A: image_url is null/undefined
**Cause:** Recipes table doesn't have image_url data
**Solution:**
- Go to Supabase Dashboard → Tables → `catalog_recipes`
- Check if `image_url` column exists
- If missing, add it: `ALTER TABLE catalog_recipes ADD COLUMN image_url TEXT;`
- Verify recipes have image URLs populated

#### Issue B: image_url has values but images don't show
**Cause:** Image URLs are broken or inaccessible
**Solution:**
- Check if URLs are valid (copy one and paste in browser)
- Verify images are publicly accessible
- Check CORS settings if images are from external domain
- Ensure URLs use HTTPS if site is HTTPS

#### Issue C: Placeholder showing instead of recipe images
**Cause:** Image URLs exist but fail to load
**Solution:**
- Check browser Network tab (F12 → Network)
- Look for failed image requests (red X)
- Verify image URLs are correct
- Check if images have been deleted from storage

### 3. Manual Verification in Supabase

**Check if recipes have images:**
```sql
SELECT id, name_common, name, image_url 
FROM catalog_recipes 
LIMIT 10;
```

**Count recipes with images:**
```sql
SELECT COUNT(*) as total, 
       COUNT(image_url) as with_images,
       COUNT(CASE WHEN image_url IS NULL THEN 1 END) as without_images
FROM catalog_recipes;
```

**Check image URL format:**
```sql
SELECT id, name_common, image_url,
       CASE 
         WHEN image_url IS NULL THEN 'NULL'
         WHEN image_url LIKE 'http%' THEN 'Valid URL'
         ELSE 'Invalid format'
       END as url_status
FROM catalog_recipes 
LIMIT 5;
```

### 4. Testing Steps

1. **Deploy latest code** to Netlify
2. **Open admin panel** and click **Recipes** tab
3. **Open browser console** (F12)
4. **Look at the debug logs** for recipe images
5. **Report what you see:**
   - Are image_url values present?
   - Are they valid URLs?
   - Do images show or just placeholders?

## Next Steps

Once you identify the issue from the console logs, let me know:
- What the recipe image_url values look like
- Whether they're null, empty, or have URLs
- If URLs are valid or broken
- Whether images show or only placeholders appear

This will help pinpoint the exact fix needed!
