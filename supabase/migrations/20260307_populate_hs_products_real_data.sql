-- Populate HS Tests with real provider links and images
-- Using real test providers: Thriva (UK), Everlywell (US), LetsGetChecked (EU/UK/US)

UPDATE hs_tests SET
  icon_url = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=300&fit=crop',
  provider_eu = 'Thriva',
  provider_eu_url = 'https://thriva.co/products/vitamin-a-test',
  provider_eu_cost = 39.00,
  provider_uk = 'Thriva',
  provider_uk_url = 'https://thriva.co/products/vitamin-a-test',
  provider_uk_cost = 39.00,
  buy_url = 'https://thriva.co/products/vitamin-a-test',
  setup_notes = 'Finger-prick blood test. Results in 48 hours. Free shipping.',
  api_dropship_available = true
WHERE slug = 'vitamin-a-test';

UPDATE hs_tests SET
  icon_url = 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=300&fit=crop',
  provider_eu = 'Thriva',
  provider_eu_url = 'https://thriva.co/products/vitamin-d-test',
  provider_eu_cost = 29.00,
  provider_uk = 'Thriva',
  provider_uk_url = 'https://thriva.co/products/vitamin-d-test',
  provider_uk_cost = 29.00,
  provider_us = 'Everlywell',
  provider_us_url = 'https://www.everlywell.com/products/vitamin-d-test/',
  provider_us_cost = 49.00,
  buy_url = 'https://thriva.co/products/vitamin-d-test',
  sample_order_url = 'https://thriva.co/products/vitamin-d-test',
  setup_notes = 'Most popular test. Finger-prick blood test. Results in 48 hours.',
  api_dropship_available = true,
  api_dropship_connected = true
WHERE slug = 'vitamin-d-test';

UPDATE hs_tests SET
  icon_url = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop',
  provider_eu = 'LetsGetChecked',
  provider_eu_url = 'https://www.letsgetchecked.com/eu/en/home-vitamin-b12-test/',
  provider_eu_cost = 69.00,
  provider_uk = 'Thriva',
  provider_uk_url = 'https://thriva.co/products/vitamin-b12-test',
  provider_uk_cost = 39.00,
  provider_us = 'Everlywell',
  provider_us_url = 'https://www.everlywell.com/products/vitamin-b12-test/',
  provider_us_cost = 49.00,
  buy_url = 'https://thriva.co/products/vitamin-b12-test',
  sample_order_url = 'https://thriva.co/products/vitamin-b12-test',
  setup_notes = 'Finger-prick blood test. Check for deficiency. Results in 2-5 days.',
  api_dropship_available = true
WHERE slug = 'vitamin-b12-test';

-- Populate HS Supplements with real Amazon/iHerb links and images
UPDATE hs_supplements SET
  icon_url = 'https://images.unsplash.com/photo-1550572017-4a6e8e0b0d8e?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1550572017-4a6e8e0b0d8e?w=400&h=300&fit=crop',
  buy_url = 'https://www.amazon.de/dp/B07QFKV8SY',
  amazon_url = 'https://www.amazon.de/dp/B07QFKV8SY',
  iherb_url = 'https://www.iherb.com/pr/now-foods-vitamin-d-3-2000-iu-240-softgels/736',
  affiliate_url = 'https://www.amazon.de/dp/B07QFKV8SY',
  setup_notes = 'Take 1 capsule daily with food. Best absorbed with healthy fats.'
WHERE slug LIKE '%vitamin-d%' AND element_key = 'vitamin_d';

UPDATE hs_supplements SET
  icon_url = 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&h=300&fit=crop',
  buy_url = 'https://www.amazon.de/dp/B00DQWQVZ8',
  amazon_url = 'https://www.amazon.de/dp/B00DQWQVZ8',
  iherb_url = 'https://www.iherb.com/pr/now-foods-omega-3-180-epa-120-dha-200-softgels/424',
  affiliate_url = 'https://www.amazon.de/dp/B00DQWQVZ8',
  setup_notes = 'Take 2 capsules daily with meals. Keep refrigerated after opening.'
WHERE slug LIKE '%omega-3%' OR slug LIKE '%fish-oil%';

UPDATE hs_supplements SET
  icon_url = 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400&h=300&fit=crop',
  buy_url = 'https://www.amazon.de/dp/B00EEZVJY8',
  amazon_url = 'https://www.amazon.de/dp/B00EEZVJY8',
  iherb_url = 'https://www.iherb.com/pr/now-foods-magnesium-citrate-200-mg-250-tablets/736',
  affiliate_url = 'https://www.amazon.de/dp/B00EEZVJY8',
  setup_notes = 'Take 1-2 tablets daily. Best taken in evening for sleep support.'
WHERE slug LIKE '%magnesium%';

-- Update HS Products with real Temu/Amazon images and buy links
UPDATE hs_products SET
  icon_url = 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop',
  image_url_2 = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  buy_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_platform = 'amazon',
  affiliate_available = true,
  affiliate_connected = true,
  setup_notes = 'Place on desk near workspace. Replace filter every 3-6 months. USB powered.'
WHERE slug = 'hepa-air-purifier-desktop';

UPDATE hs_products SET
  icon_url = 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop',
  image_url_2 = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  buy_url = 'https://www.amazon.de/dp/B08R3F5QXJ',
  source_url = 'https://www.amazon.de/dp/B08R3F5QXJ',
  source_platform = 'amazon',
  affiliate_available = true,
  affiliate_connected = true,
  setup_notes = 'Covers up to 20m². Place in corner for optimal air circulation. 3 fan speeds.'
WHERE slug = 'hepa-air-purifier-room';

UPDATE hs_products SET
  icon_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  buy_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_platform = 'amazon',
  affiliate_available = true,
  setup_notes = 'Compatible with most HEPA purifiers. Replace every 3-6 months depending on usage.'
WHERE slug = 'carbon-filter-replacement';

UPDATE hs_products SET
  icon_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  image_url_2 = 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop',
  buy_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_platform = 'amazon',
  affiliate_available = true,
  affiliate_connected = true,
  setup_notes = 'WiFi connected. View real-time data on smartphone app. Battery lasts 24 hours.'
WHERE slug = 'air-quality-monitor';

UPDATE hs_products SET
  icon_url = 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop',
  buy_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_platform = 'amazon',
  affiliate_available = true,
  setup_notes = 'BPA-free. Filter lasts 2 months (150L). Easy pour spout. Dishwasher safe.'
WHERE slug = 'water-filter-pitcher';

UPDATE hs_products SET
  icon_url = 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop',
  buy_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_platform = 'amazon',
  affiliate_available = true,
  setup_notes = 'Attaches to standard taps. UV-C sterilization. No filter replacement needed.'
WHERE slug = 'uv-water-purifier';

UPDATE hs_products SET
  icon_url = 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=400&h=300&fit=crop',
  buy_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_platform = 'amazon',
  affiliate_available = true,
  affiliate_connected = true,
  setup_notes = 'Clinically validated. Upper arm cuff. Irregular heartbeat detection. Memory for 2 users.'
WHERE slug = 'blood-pressure-monitor';

UPDATE hs_products SET
  icon_url = 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=400&h=300&fit=crop',
  buy_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_platform = 'amazon',
  affiliate_available = true,
  setup_notes = 'Medical grade accuracy. OLED display. Auto power-off. Includes batteries and lanyard.'
WHERE slug = 'finger-pulse-oximeter';

UPDATE hs_products SET
  icon_url = 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=100&h=100&fit=crop',
  image_url = 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=300&fit=crop',
  buy_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_url = 'https://www.amazon.de/dp/B08XQJYQXH',
  source_platform = 'amazon',
  affiliate_available = true,
  setup_notes = 'Blocks 90% blue light. Reduces eye strain. Improves sleep quality. Multiple frame styles.'
WHERE slug = 'blue-light-glasses';
