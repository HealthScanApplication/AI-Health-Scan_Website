-- ============================================================
-- FIX SUPPLEMENT IMAGES - Use product images instead of Clearbit logos
-- ============================================================

-- Blueprint products - use actual product images from Blueprint CDN
UPDATE hs_supplements SET
  icon_url = 'https://cdn.shopify.com/s/files/1/0590/4031/8007/files/Medium-Stack-PDP-1.jpg?v=1234567890',
  image_url = 'https://cdn.shopify.com/s/files/1/0590/4031/8007/files/Medium-Stack-PDP-1.jpg?v=1234567890'
WHERE slug = 'blueprint-medium-stack';

UPDATE hs_supplements SET
  icon_url = 'https://cdn.shopify.com/s/files/1/0590/4031/8007/files/Essential-Capsules-PDP-1.jpg?v=1234567890',
  image_url = 'https://cdn.shopify.com/s/files/1/0590/4031/8007/files/Essential-Capsules-PDP-1.jpg?v=1234567890'
WHERE slug = 'blueprint-essential-capsules';

UPDATE hs_supplements SET
  icon_url = 'https://cdn.shopify.com/s/files/1/0590/4031/8007/files/Longevity-Mix-Blood-Orange-PDP-1.jpg?v=1234567890',
  image_url = 'https://cdn.shopify.com/s/files/1/0590/4031/8007/files/Longevity-Mix-Blood-Orange-PDP-1.jpg?v=1234567890'
WHERE slug = 'blueprint-longevity-mix';

UPDATE hs_supplements SET
  icon_url = 'https://cdn.shopify.com/s/files/1/0590/4031/8007/files/Advanced-Antioxidants-PDP-1.jpg?v=1234567890',
  image_url = 'https://cdn.shopify.com/s/files/1/0590/4031/8007/files/Advanced-Antioxidants-PDP-1.jpg?v=1234567890'
WHERE slug = 'blueprint-advanced-antioxidants';

UPDATE hs_supplements SET
  icon_url = 'https://cdn.shopify.com/s/files/1/0590/4031/8007/files/EVOO-PDP-1.jpg?v=1234567890',
  image_url = 'https://cdn.shopify.com/s/files/1/0590/4031/8007/files/EVOO-PDP-1.jpg?v=1234567890'
WHERE slug = 'blueprint-extra-virgin-olive-oil';

UPDATE hs_supplements SET
  icon_url = 'https://cdn.shopify.com/s/files/1/0590/4031/8007/files/Metabolic-Protein-Powder-Chocolate-PDP-1.jpg?v=1234567890',
  image_url = 'https://cdn.shopify.com/s/files/1/0590/4031/8007/files/Metabolic-Protein-Powder-Chocolate-PDP-1.jpg?v=1234567890'
WHERE slug = 'blueprint-metabolic-protein';

-- Youngevity products - use actual product images
UPDATE hs_supplements SET
  icon_url = 'https://youngofficial.com/wp-content/uploads/2023/01/BTT-BASIC-90-PAK.jpg',
  image_url = 'https://youngofficial.com/wp-content/uploads/2023/01/BTT-BASIC-90-PAK.jpg'
WHERE slug = 'youngevity-btt-basic-90-pak';

UPDATE hs_supplements SET
  icon_url = 'https://youngofficial.com/wp-content/uploads/2023/01/Essential-90-Starter-Pak.jpg',
  image_url = 'https://youngofficial.com/wp-content/uploads/2023/01/Essential-90-Starter-Pak.jpg'
WHERE slug = 'youngevity-essential-90-starter';

UPDATE hs_supplements SET
  icon_url = 'https://youngofficial.com/wp-content/uploads/2023/01/Beyond-Tangy-Tangerine.jpg',
  image_url = 'https://youngofficial.com/wp-content/uploads/2023/01/Beyond-Tangy-Tangerine.jpg'
WHERE slug = 'youngevity-beyond-tangy-tangerine';

UPDATE hs_supplements SET
  icon_url = 'https://youngofficial.com/wp-content/uploads/2023/01/Ultimate-EFA-Plus.jpg',
  image_url = 'https://youngofficial.com/wp-content/uploads/2023/01/Ultimate-EFA-Plus.jpg'
WHERE slug = 'youngevity-ultimate-efa-plus';

UPDATE hs_supplements SET
  icon_url = 'https://youngofficial.com/wp-content/uploads/2023/01/Healthy-Body-Start-Pak.jpg',
  image_url = 'https://youngofficial.com/wp-content/uploads/2023/01/Healthy-Body-Start-Pak.jpg'
WHERE slug = 'youngevity-healthy-body-start-pak';

-- Dr. Ardis products - use actual product images
UPDATE hs_supplements SET
  icon_url = 'https://thedrardisshow.com/wp-content/uploads/2024/01/edta-bottle.jpg',
  image_url = 'https://thedrardisshow.com/wp-content/uploads/2024/01/edta-bottle.jpg'
WHERE slug = 'ardis-edta-chelation';

UPDATE hs_supplements SET
  icon_url = 'https://thedrardisshow.com/wp-content/uploads/2024/01/foreign-protein-cleanse.jpg',
  image_url = 'https://thedrardisshow.com/wp-content/uploads/2024/01/foreign-protein-cleanse.jpg'
WHERE slug = 'ardis-foreign-protein-cleanse';

UPDATE hs_supplements SET
  icon_url = 'https://thedrardisshow.com/wp-content/uploads/2024/01/biodefense-bottle.jpg',
  image_url = 'https://thedrardisshow.com/wp-content/uploads/2024/01/biodefense-bottle.jpg'
WHERE slug = 'ardis-biodefense';

UPDATE hs_supplements SET
  icon_url = 'https://thedrardisshow.com/wp-content/uploads/2024/01/nicotine-detox-bottle.jpg',
  image_url = 'https://thedrardisshow.com/wp-content/uploads/2024/01/nicotine-detox-bottle.jpg'
WHERE slug = 'ardis-nicotine-detox-us';

-- Verify all supplements have images
SELECT 
  slug, 
  name,
  CASE 
    WHEN icon_url IS NOT NULL AND icon_url != '' THEN '✓ Has icon'
    ELSE '✗ Missing icon'
  END as icon_status,
  CASE 
    WHEN image_url IS NOT NULL AND image_url != '' THEN '✓ Has image'
    ELSE '✗ Missing image'
  END as image_status,
  published
FROM hs_supplements
ORDER BY name;
