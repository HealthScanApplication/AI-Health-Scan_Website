// AUTO-GENERATED from production `protocols`/`protocol_items` (kind=action, chronological).
// Hero GOALS -> named PROTOCOLS -> exact day-timeline items + the real protocol description.
import type { ProtocolItem } from "./protocolCategories";

export interface RealProtocol {
  key: string; name: string; chip: string;
  description: string;
  creator?: string; source?: string; evidence?: string;
  days?: number; score?: number;
  items: ProtocolItem[];
  dos?: string[];    // "do" guidance shown under the protocol card
  donts?: string[];  // "don't" / avoid guidance shown under the protocol card
}
export interface Goal { key: string; label: string; pillar: "Health" | "Beauty" | "Fitness"; protocols: RealProtocol[]; }

export const GOALS: Goal[] = [
  {
    "key": "health",
    "label": "Health",
    "pillar": "Health",
    "protocols": [
      {
        "key": "self-heal-women",
        "name": "Self Heal by Design — Women",
        "chip": "Women",
        "description": "A women-tailored version of Barbara O'Neill's Self Heal by Design protocol, with hormone-cycle awareness baked into the rhythm. Same foundational routine — morning sun, intermittent fasting, raw plants, sleep hygiene — plus Wild Yam Cream (Female) for natural progesterone support, evening primrose, and a heavier emphasis on liver decongestion (castor-oil packs, dandelion bitters) that female sex hormones depend on. Why it matters: Barbara teaches that most modern female symptoms — heavy periods, PMS, hot flushes, mood — trace back to estrogen dominance from a congested liver and poor sleep, and this protocol is her clinical answer to that pattern. Source: Self Heal by Design (book) + Misty Mountain Health Retreat curriculum",
        "score": 88,
        "evidence": "moderate",
        "items": [
          {
            "name": "Gratitude on Waking",
            "item_type": "activity",
            "meta": "05:30",
            "group_name": "Plan",
            "children": [
              "Name three things you're grateful for before getting out of bed.",
              "The first thoughts of the day set the body's biochemistry for hours afterwards."
            ]
          },
          {
            "name": "Tongue Scraping",
            "item_type": "activity",
            "meta": "05:35",
            "group_name": "Clean",
            "children": [
              "Copper or stainless scraper, back to front, 5–10 strokes. Rinse between passes.",
              "Removes the overnight bacterial coating before you drink water — don't re-swallow it."
            ]
          },
          {
            "name": "Warm Lemon Water",
            "item_type": "consume",
            "meta": "05:40",
            "group_name": "Consume",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_warm_lemon_water-1779312331717.png",
            "children": [
              "Sip slowly, don't gulp",
              "Room temperature, not iced"
            ]
          },
          {
            "name": "Apple Cider Vinegar Tonic",
            "item_type": "supplement",
            "meta": "05:50",
            "group_name": "Supplement",
            "image_url": "https://www.trelune.com.au/cdn/shop/files/tre-lune-digest-tincture-barbara-oneill-australia-_Front.jpg?width=1024",
            "children": [
              "1 tbsp raw ACV (with the mother) in warm water, 20 min before meals.",
              "Primes stomach acid — low HCl is the hidden cause of most \"indigestion\" and reflux."
            ]
          },
          {
            "name": "Oil Pulling",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Clean",
            "children": [
              "Swish 1 tbsp cold-pressed coconut oil — pulls bacteria + biofilm from teeth & gums.",
              "Spit out (don't swallow) — the oil now carries pathogens you don't want re-absorbed.",
              "Rinse with warm salt water + brush after. Best done before food or coffee."
            ]
          },
          {
            "name": "Dry Skin Brushing",
            "item_type": "activity",
            "meta": "06:15",
            "group_name": "Wellness",
            "children": [
              "Use a natural bristle brush, always upward toward the heart — that's the direction of lymph flow.",
              "Pumps the lymphatic system, which has no heart-pump of its own. Skin is the third kidney.",
              "Do it dry, before showering, 3–5 minutes a day."
            ]
          },
          {
            "name": "Hot/Cold Contrast Shower",
            "item_type": "activity",
            "meta": "06:20",
            "group_name": "Wellness",
            "children": [
              "30 sec hot · 30 sec cold · repeat 3–5 cycles. Always finish on cold.",
              "Trains vascular tone, pumps lymph, raises norepinephrine for alertness.",
              "Cold finish activates brown fat and seals the skin closed against the day."
            ]
          },
          {
            "name": "Barefoot Grounding",
            "item_type": "activity",
            "meta": "06:30",
            "group_name": "Wellness"
          },
          {
            "name": "Morning Sunlight",
            "item_type": "activity",
            "meta": "06:35",
            "group_name": "Wellness",
            "children": [
              "No Sunglasses",
              "Skin Exposed"
            ]
          },
          {
            "name": "4-7-8 Breathing",
            "item_type": "activity",
            "meta": "06:55",
            "group_name": "Wellness",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_478_breathing.png",
            "children": [
              "Nasal breathing only",
              "Prefer outdoor / open window"
            ]
          },
          {
            "name": "Rebounding",
            "item_type": "activity",
            "meta": "07:00",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_rebounding.png",
            "children": [
              "Bounce gently 5–15 min. Even feet-on-mat counts. Most efficient lymphatic pump there is.",
              "Up-down gravity opens and closes the one-way lymph valves — nothing else moves lymph faster."
            ]
          },
          {
            "name": "Spinal Mobility",
            "item_type": "activity",
            "meta": "07:15",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_spinal_mobility.png"
          },
          {
            "name": "Beetroot",
            "item_type": "consume",
            "meta": "07:30",
            "group_name": "Consume",
            "image_url": "https://ermbkttsyvpenjjxaxcf.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/1773496422837-5a2ifn.jpg",
            "description": "Beet + Carrot + Greens Juice",
            "children": [
              "Raw or lightly steamed — betaine & betalains stimulate bile flow and thin sluggish bile."
            ]
          },
          {
            "name": "Freshly Ground Flaxseed",
            "item_type": "supplement",
            "meta": "07:45",
            "group_name": "Supplement"
          },
          {
            "name": "Soaked Oats with Berries, Flax & Raw Honey",
            "item_type": "consume",
            "meta": "08:00",
            "group_name": "Consume",
            "description": "Breakfast like a king.",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Brisk Walk After Breakfast",
            "item_type": "activity",
            "meta": "08:35",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_breakfast.png"
          },
          {
            "name": "Meditation",
            "item_type": "activity",
            "meta": "09:00",
            "group_name": "Plan"
          },
          {
            "name": "Big Rainbow Salad with Sprouts",
            "item_type": "consume",
            "meta": "12:30",
            "group_name": "Consume",
            "description": "Lunch like a prince.",
            "children": [
              "75% raw plant foods",
              "Chew Each Bite",
              "No water with meal",
              "Include bitter greens",
              "Include cruciferous veg"
            ]
          },
          {
            "name": "Brisk Walk After Lunch",
            "item_type": "activity",
            "meta": "13:15",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_lunch.png"
          },
          {
            "name": "Midday Sun for Vitamin D",
            "item_type": "activity",
            "meta": "14:00",
            "group_name": "Wellness",
            "children": [
              "Skin Exposed",
              "No sunscreen mid-day"
            ]
          },
          {
            "name": "Daily Nature Time",
            "item_type": "activity",
            "meta": "15:00",
            "group_name": "Plan"
          },
          {
            "name": "Infrared / Steam Sauna",
            "item_type": "activity",
            "meta": "16:00",
            "group_name": "Wellness",
            "description": "3-5x/week."
          },
          {
            "name": "Daily Outdoor Walk",
            "item_type": "activity",
            "meta": "17:00",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_daily_outdoor_walk.png",
            "children": [
              "30–60 min outdoors, ideally morning or late afternoon light.",
              "Walking pumps lymph, oxygenates blood, anchors hormones to the day-night cycle."
            ]
          },
          {
            "name": "Steamed Greens + Lentil Stew & Sauerkraut",
            "item_type": "consume",
            "meta": "18:00",
            "group_name": "Consume",
            "description": "Dinner like a pauper.",
            "children": [
              "Stop eating by 6pm",
              "Chew Each Bite",
              "No water with meal"
            ]
          },
          {
            "name": "Ginger Tea",
            "item_type": "consume",
            "meta": "18:30",
            "group_name": "Consume"
          },
          {
            "name": "Post-Dinner Walk",
            "item_type": "activity",
            "meta": "18:45",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_dinner.png"
          },
          {
            "name": "Castor Oil Pack on Liver",
            "item_type": "activity",
            "meta": "19:30",
            "group_name": "Wellness",
            "description": "3-5 nights per week.",
            "children": [
              "Wool flannel + cold-pressed castor oil + hot water bottle, 30–60 min on right side.",
              "Increases lymphocyte production, softens scar tissue, deeply relaxing for vagus nerve."
            ]
          },
          {
            "name": "Epsom Salt Bath",
            "item_type": "activity",
            "meta": "20:00",
            "group_name": "Wellness",
            "children": [
              "1–2 cups Epsom (magnesium sulfate) in a hot bath, 20 min. Skin absorbs the magnesium.",
              "Relaxes muscles, draws toxins through sweat, dramatically improves sleep onset."
            ]
          },
          {
            "name": "Magnesium Oil Spray",
            "item_type": "supplement",
            "meta": "20:30",
            "group_name": "Supplement",
            "image_url": "https://www.trelune.com.au/cdn/shop/files/earthbless-remineralize-magnesium-oil.jpg?width=1024",
            "children": [
              "5–10 sprays magnesium chloride on inner forearms or calves before bed.",
              "Transdermal bypasses poor gut absorption — relaxes muscles + nervous system for sleep."
            ]
          },
          {
            "name": "Turmeric Golden Milk",
            "item_type": "consume",
            "meta": "20:45",
            "group_name": "Consume"
          },
          {
            "name": "Chamomile / Passionflower Tea",
            "item_type": "consume",
            "meta": "21:15",
            "group_name": "Consume"
          },
          {
            "name": "Evening Tooth Brushing",
            "item_type": "activity",
            "meta": "21:45",
            "group_name": "Clean"
          },
          {
            "name": "Gratitude Journal",
            "item_type": "activity",
            "meta": "21:50",
            "group_name": "Plan",
            "children": [
              "Write 3 specific gratitudes + name 1 person to forgive each evening.",
              "Unforgiveness raises cortisol and suppresses immunity. Gratitude does the opposite."
            ]
          },
          {
            "name": "Sleep in Complete Darkness",
            "item_type": "activity",
            "meta": "22:00",
            "group_name": "Wellness",
            "description": "Bed by 10pm.",
            "children": [
              "Sleep on left side",
              "Cool Bedroom",
              "Window cracked for fresh air",
              "Cover all LED lights",
              "In bed by 10pm",
              "No phones/WiFi in bedroom",
              "No screens 1-2h before bed",
              "Wear Natural Fibres",
              "Bedroom aired during the day"
            ]
          }
        ]
      },
      {
        "key": "self-heal-men",
        "name": "Self Heal by Design — Men",
        "chip": "Men",
        "description": "A male-tailored version of Barbara O'Neill's Self Heal by Design protocol. Same foundational routine — morning sun, intermittent fasting, raw plants, hydration, sleep hygiene — plus Wild Yam Cream (Male), prostate-supportive saw palmetto and pumpkin seed protein, heavier morning movement (Pilates or brisk walking), and cold-water hydrotherapy for testosterone signalling. Why it matters: Barbara argues that adult male symptoms — declining energy, libido, brain fog, abdominal fat — track back to insulin resistance, sleep debt, and an inflamed liver, and the male variant of the protocol is her practical playbook for reversing that arc. Source: Self Heal by Design (book) + Mountain Skies Wellness Retreat. Wild Yam Cream",
        "score": 88,
        "evidence": "moderate",
        "items": [
          {
            "name": "Gratitude on Waking",
            "item_type": "activity",
            "meta": "05:30",
            "group_name": "Plan",
            "children": [
              "Name three things you're grateful for before getting out of bed.",
              "The first thoughts of the day set the body's biochemistry for hours afterwards."
            ]
          },
          {
            "name": "Tongue Scraping",
            "item_type": "activity",
            "meta": "05:35",
            "group_name": "Clean",
            "children": [
              "Copper or stainless scraper, back to front, 5–10 strokes. Rinse between passes.",
              "Removes the overnight bacterial coating before you drink water — don't re-swallow it."
            ]
          },
          {
            "name": "Warm Lemon Water",
            "item_type": "consume",
            "meta": "05:40",
            "group_name": "Consume",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_warm_lemon_water-1779312331717.png",
            "children": [
              "Sip slowly, don't gulp",
              "Room temperature, not iced"
            ]
          },
          {
            "name": "Apple Cider Vinegar Tonic",
            "item_type": "supplement",
            "meta": "05:50",
            "group_name": "Supplement",
            "image_url": "https://www.trelune.com.au/cdn/shop/files/tre-lune-digest-tincture-barbara-oneill-australia-_Front.jpg?width=1024",
            "children": [
              "1 tbsp raw ACV (with the mother) in warm water, 20 min before meals.",
              "Primes stomach acid — low HCl is the hidden cause of most \"indigestion\" and reflux."
            ]
          },
          {
            "name": "Oil Pulling",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Clean",
            "children": [
              "Swish 1 tbsp cold-pressed coconut oil — pulls bacteria + biofilm from teeth & gums.",
              "Spit out (don't swallow) — the oil now carries pathogens you don't want re-absorbed.",
              "Rinse with warm salt water + brush after. Best done before food or coffee."
            ]
          },
          {
            "name": "Dry Skin Brushing",
            "item_type": "activity",
            "meta": "06:15",
            "group_name": "Wellness",
            "children": [
              "Use a natural bristle brush, always upward toward the heart — that's the direction of lymph flow.",
              "Pumps the lymphatic system, which has no heart-pump of its own. Skin is the third kidney.",
              "Do it dry, before showering, 3–5 minutes a day."
            ]
          },
          {
            "name": "Hot/Cold Contrast Shower",
            "item_type": "activity",
            "meta": "06:20",
            "group_name": "Wellness",
            "children": [
              "30 sec hot · 30 sec cold · repeat 3–5 cycles. Always finish on cold.",
              "Trains vascular tone, pumps lymph, raises norepinephrine for alertness.",
              "Cold finish activates brown fat and seals the skin closed against the day."
            ]
          },
          {
            "name": "Barefoot Grounding",
            "item_type": "activity",
            "meta": "06:30",
            "group_name": "Wellness"
          },
          {
            "name": "Morning Sunlight",
            "item_type": "activity",
            "meta": "06:35",
            "group_name": "Wellness",
            "children": [
              "No Sunglasses",
              "Skin Exposed"
            ]
          },
          {
            "name": "4-7-8 Breathing",
            "item_type": "activity",
            "meta": "06:55",
            "group_name": "Wellness",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_478_breathing.png",
            "children": [
              "Nasal breathing only",
              "Prefer outdoor / open window"
            ]
          },
          {
            "name": "Rebounding",
            "item_type": "activity",
            "meta": "07:00",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_rebounding.png",
            "children": [
              "Bounce gently 5–15 min. Even feet-on-mat counts. Most efficient lymphatic pump there is.",
              "Up-down gravity opens and closes the one-way lymph valves — nothing else moves lymph faster."
            ]
          },
          {
            "name": "Spinal Mobility",
            "item_type": "activity",
            "meta": "07:15",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_spinal_mobility.png"
          },
          {
            "name": "Beetroot",
            "item_type": "consume",
            "meta": "07:30",
            "group_name": "Consume",
            "image_url": "https://ermbkttsyvpenjjxaxcf.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/1773496422837-5a2ifn.jpg",
            "description": "Beet + Carrot + Greens Juice",
            "children": [
              "Raw or lightly steamed — betaine & betalains stimulate bile flow and thin sluggish bile."
            ]
          },
          {
            "name": "Freshly Ground Flaxseed",
            "item_type": "supplement",
            "meta": "07:45",
            "group_name": "Supplement"
          },
          {
            "name": "Soaked Oats with Berries, Flax & Raw Honey",
            "item_type": "consume",
            "meta": "08:00",
            "group_name": "Consume",
            "description": "Breakfast like a king.",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Brisk Walk After Breakfast",
            "item_type": "activity",
            "meta": "08:35",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_breakfast.png"
          },
          {
            "name": "Meditation",
            "item_type": "activity",
            "meta": "09:00",
            "group_name": "Plan"
          },
          {
            "name": "Big Rainbow Salad with Sprouts",
            "item_type": "consume",
            "meta": "12:30",
            "group_name": "Consume",
            "description": "Lunch like a prince.",
            "children": [
              "75% raw plant foods",
              "Chew Each Bite",
              "No water with meal",
              "Include bitter greens",
              "Include cruciferous veg"
            ]
          },
          {
            "name": "Brisk Walk After Lunch",
            "item_type": "activity",
            "meta": "13:15",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_lunch.png"
          },
          {
            "name": "Midday Sun for Vitamin D",
            "item_type": "activity",
            "meta": "14:00",
            "group_name": "Wellness",
            "children": [
              "Skin Exposed",
              "No sunscreen mid-day"
            ]
          },
          {
            "name": "Daily Nature Time",
            "item_type": "activity",
            "meta": "15:00",
            "group_name": "Plan"
          },
          {
            "name": "Infrared / Steam Sauna",
            "item_type": "activity",
            "meta": "16:00",
            "group_name": "Wellness",
            "description": "3-5x/week."
          },
          {
            "name": "Daily Outdoor Walk",
            "item_type": "activity",
            "meta": "17:00",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_daily_outdoor_walk.png",
            "children": [
              "30–60 min outdoors, ideally morning or late afternoon light.",
              "Walking pumps lymph, oxygenates blood, anchors hormones to the day-night cycle."
            ]
          },
          {
            "name": "Steamed Greens + Lentil Stew & Sauerkraut",
            "item_type": "consume",
            "meta": "18:00",
            "group_name": "Consume",
            "description": "Dinner like a pauper.",
            "children": [
              "Stop eating by 6pm",
              "Chew Each Bite",
              "No water with meal"
            ]
          },
          {
            "name": "Ginger Tea",
            "item_type": "consume",
            "meta": "18:30",
            "group_name": "Consume"
          },
          {
            "name": "Post-Dinner Walk",
            "item_type": "activity",
            "meta": "18:45",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_dinner.png"
          },
          {
            "name": "Castor Oil Pack on Liver",
            "item_type": "activity",
            "meta": "19:30",
            "group_name": "Wellness",
            "description": "3-5 nights per week.",
            "children": [
              "Wool flannel + cold-pressed castor oil + hot water bottle, 30–60 min on right side.",
              "Increases lymphocyte production, softens scar tissue, deeply relaxing for vagus nerve."
            ]
          },
          {
            "name": "Epsom Salt Bath",
            "item_type": "activity",
            "meta": "20:00",
            "group_name": "Wellness",
            "children": [
              "1–2 cups Epsom (magnesium sulfate) in a hot bath, 20 min. Skin absorbs the magnesium.",
              "Relaxes muscles, draws toxins through sweat, dramatically improves sleep onset."
            ]
          },
          {
            "name": "Magnesium Oil Spray",
            "item_type": "supplement",
            "meta": "20:30",
            "group_name": "Supplement",
            "image_url": "https://www.trelune.com.au/cdn/shop/files/earthbless-remineralize-magnesium-oil.jpg?width=1024",
            "children": [
              "5–10 sprays magnesium chloride on inner forearms or calves before bed.",
              "Transdermal bypasses poor gut absorption — relaxes muscles + nervous system for sleep."
            ]
          },
          {
            "name": "Turmeric Golden Milk",
            "item_type": "consume",
            "meta": "20:45",
            "group_name": "Consume"
          },
          {
            "name": "Chamomile / Passionflower Tea",
            "item_type": "consume",
            "meta": "21:15",
            "group_name": "Consume"
          },
          {
            "name": "Evening Tooth Brushing",
            "item_type": "activity",
            "meta": "21:45",
            "group_name": "Clean"
          },
          {
            "name": "Gratitude Journal",
            "item_type": "activity",
            "meta": "21:50",
            "group_name": "Plan",
            "children": [
              "Write 3 specific gratitudes + name 1 person to forgive each evening.",
              "Unforgiveness raises cortisol and suppresses immunity. Gratitude does the opposite."
            ]
          },
          {
            "name": "Sleep in Complete Darkness",
            "item_type": "activity",
            "meta": "22:00",
            "group_name": "Wellness",
            "description": "Bed by 10pm.",
            "children": [
              "Sleep on left side",
              "Cool Bedroom",
              "Window cracked for fresh air",
              "Cover all LED lights",
              "In bed by 10pm",
              "No phones/WiFi in bedroom",
              "No screens 1-2h before bed",
              "Wear Natural Fibres",
              "Bedroom aired during the day"
            ]
          }
        ]
      },
      {
        "key": "self-heal-teen-female",
        "name": "Self Heal by Design — Teen Female",
        "chip": "Teen Female",
        "description": "A gentler version of Barbara O'Neill's Self Heal by Design protocol tailored for teen girls (13–19). Same plant-based, sun-based, sleep-based principles, with quantities and intensity scaled down for adolescent physiology: no extended fasting, fruit-rich breakfast, no caffeine, screen curfew 90 minutes before bed. Adds menstrual-cycle awareness — castor-oil packs in the luteal phase, magnesium glycinate at night for cramps, iron-supportive foods (parsley, beetroot, dark leafy greens, soaked pumpkin seeds) around menstruation — plus Wild Yam Cream (Teen) for the hormonal transition years. Why it matters: Barbara teaches that the teenage decade is when lifelong hormone, gut, mood, and circadian patterns are set — and that early support during the menarche years (12–16) prevents the heavy periods, PMS, acne, and mood swings most women carry into adulthood. Source: Self Heal by Design (book), chapters on growth, puberty and the menstrual cycle",
        "score": 86,
        "evidence": "moderate",
        "items": [
          {
            "name": "Gratitude on Waking",
            "item_type": "activity",
            "meta": "05:30",
            "group_name": "Plan",
            "children": [
              "Name three things you're grateful for before getting out of bed.",
              "The first thoughts of the day set the body's biochemistry for hours afterwards."
            ]
          },
          {
            "name": "Tongue Scraping",
            "item_type": "activity",
            "meta": "05:35",
            "group_name": "Clean",
            "children": [
              "Copper or stainless scraper, back to front, 5–10 strokes. Rinse between passes.",
              "Removes the overnight bacterial coating before you drink water — don't re-swallow it."
            ]
          },
          {
            "name": "Warm Lemon Water",
            "item_type": "consume",
            "meta": "05:40",
            "group_name": "Consume",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_warm_lemon_water-1779312331717.png",
            "children": [
              "Sip slowly, don't gulp",
              "Room temperature, not iced"
            ]
          },
          {
            "name": "Apple Cider Vinegar Tonic",
            "item_type": "supplement",
            "meta": "05:50",
            "group_name": "Supplement",
            "image_url": "https://www.trelune.com.au/cdn/shop/files/tre-lune-digest-tincture-barbara-oneill-australia-_Front.jpg?width=1024",
            "children": [
              "1 tbsp raw ACV (with the mother) in warm water, 20 min before meals.",
              "Primes stomach acid — low HCl is the hidden cause of most \"indigestion\" and reflux."
            ]
          },
          {
            "name": "Oil Pulling",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Clean",
            "children": [
              "Swish 1 tbsp cold-pressed coconut oil — pulls bacteria + biofilm from teeth & gums.",
              "Spit out (don't swallow) — the oil now carries pathogens you don't want re-absorbed.",
              "Rinse with warm salt water + brush after. Best done before food or coffee."
            ]
          },
          {
            "name": "Dry Skin Brushing",
            "item_type": "activity",
            "meta": "06:15",
            "group_name": "Wellness",
            "children": [
              "Use a natural bristle brush, always upward toward the heart — that's the direction of lymph flow.",
              "Pumps the lymphatic system, which has no heart-pump of its own. Skin is the third kidney.",
              "Do it dry, before showering, 3–5 minutes a day."
            ]
          },
          {
            "name": "Hot/Cold Contrast Shower",
            "item_type": "activity",
            "meta": "06:20",
            "group_name": "Wellness",
            "children": [
              "30 sec hot · 30 sec cold · repeat 3–5 cycles. Always finish on cold.",
              "Trains vascular tone, pumps lymph, raises norepinephrine for alertness.",
              "Cold finish activates brown fat and seals the skin closed against the day."
            ]
          },
          {
            "name": "Barefoot Grounding",
            "item_type": "activity",
            "meta": "06:30",
            "group_name": "Wellness"
          },
          {
            "name": "Morning Sunlight",
            "item_type": "activity",
            "meta": "06:35",
            "group_name": "Wellness",
            "children": [
              "No Sunglasses",
              "Skin Exposed"
            ]
          },
          {
            "name": "4-7-8 Breathing",
            "item_type": "activity",
            "meta": "06:55",
            "group_name": "Wellness",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_478_breathing.png",
            "children": [
              "Nasal breathing only",
              "Prefer outdoor / open window"
            ]
          },
          {
            "name": "Rebounding",
            "item_type": "activity",
            "meta": "07:00",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_rebounding.png",
            "children": [
              "Bounce gently 5–15 min. Even feet-on-mat counts. Most efficient lymphatic pump there is.",
              "Up-down gravity opens and closes the one-way lymph valves — nothing else moves lymph faster."
            ]
          },
          {
            "name": "Spinal Mobility",
            "item_type": "activity",
            "meta": "07:15",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_spinal_mobility.png"
          },
          {
            "name": "Beetroot",
            "item_type": "consume",
            "meta": "07:30",
            "group_name": "Consume",
            "image_url": "https://ermbkttsyvpenjjxaxcf.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/1773496422837-5a2ifn.jpg",
            "description": "Beet + Carrot + Greens Juice",
            "children": [
              "Raw or lightly steamed — betaine & betalains stimulate bile flow and thin sluggish bile."
            ]
          },
          {
            "name": "Freshly Ground Flaxseed",
            "item_type": "supplement",
            "meta": "07:45",
            "group_name": "Supplement"
          },
          {
            "name": "Soaked Oats with Berries, Flax & Raw Honey",
            "item_type": "consume",
            "meta": "08:00",
            "group_name": "Consume",
            "description": "Breakfast like a king.",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Brisk Walk After Breakfast",
            "item_type": "activity",
            "meta": "08:35",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_breakfast.png"
          },
          {
            "name": "Meditation",
            "item_type": "activity",
            "meta": "09:00",
            "group_name": "Plan"
          },
          {
            "name": "Big Rainbow Salad with Sprouts",
            "item_type": "consume",
            "meta": "12:30",
            "group_name": "Consume",
            "description": "Lunch like a prince.",
            "children": [
              "75% raw plant foods",
              "Chew Each Bite",
              "No water with meal",
              "Include bitter greens",
              "Include cruciferous veg"
            ]
          },
          {
            "name": "Brisk Walk After Lunch",
            "item_type": "activity",
            "meta": "13:15",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_lunch.png"
          },
          {
            "name": "Midday Sun for Vitamin D",
            "item_type": "activity",
            "meta": "14:00",
            "group_name": "Wellness",
            "children": [
              "Skin Exposed",
              "No sunscreen mid-day"
            ]
          },
          {
            "name": "Daily Nature Time",
            "item_type": "activity",
            "meta": "15:00",
            "group_name": "Plan"
          },
          {
            "name": "Infrared / Steam Sauna",
            "item_type": "activity",
            "meta": "16:00",
            "group_name": "Wellness",
            "description": "3-5x/week."
          },
          {
            "name": "Daily Outdoor Walk",
            "item_type": "activity",
            "meta": "17:00",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_daily_outdoor_walk.png",
            "children": [
              "30–60 min outdoors, ideally morning or late afternoon light.",
              "Walking pumps lymph, oxygenates blood, anchors hormones to the day-night cycle."
            ]
          },
          {
            "name": "Steamed Greens + Lentil Stew & Sauerkraut",
            "item_type": "consume",
            "meta": "18:00",
            "group_name": "Consume",
            "description": "Dinner like a pauper.",
            "children": [
              "Stop eating by 6pm",
              "Chew Each Bite",
              "No water with meal"
            ]
          },
          {
            "name": "Ginger Tea",
            "item_type": "consume",
            "meta": "18:30",
            "group_name": "Consume"
          },
          {
            "name": "Post-Dinner Walk",
            "item_type": "activity",
            "meta": "18:45",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_dinner.png"
          },
          {
            "name": "Castor Oil Pack on Liver",
            "item_type": "activity",
            "meta": "19:30",
            "group_name": "Wellness",
            "description": "3-5 nights per week.",
            "children": [
              "Wool flannel + cold-pressed castor oil + hot water bottle, 30–60 min on right side.",
              "Increases lymphocyte production, softens scar tissue, deeply relaxing for vagus nerve."
            ]
          },
          {
            "name": "Epsom Salt Bath",
            "item_type": "activity",
            "meta": "20:00",
            "group_name": "Wellness",
            "children": [
              "1–2 cups Epsom (magnesium sulfate) in a hot bath, 20 min. Skin absorbs the magnesium.",
              "Relaxes muscles, draws toxins through sweat, dramatically improves sleep onset."
            ]
          },
          {
            "name": "Magnesium Oil Spray",
            "item_type": "supplement",
            "meta": "20:30",
            "group_name": "Supplement",
            "image_url": "https://www.trelune.com.au/cdn/shop/files/earthbless-remineralize-magnesium-oil.jpg?width=1024",
            "children": [
              "5–10 sprays magnesium chloride on inner forearms or calves before bed.",
              "Transdermal bypasses poor gut absorption — relaxes muscles + nervous system for sleep."
            ]
          },
          {
            "name": "Turmeric Golden Milk",
            "item_type": "consume",
            "meta": "20:45",
            "group_name": "Consume"
          },
          {
            "name": "Chamomile / Passionflower Tea",
            "item_type": "consume",
            "meta": "21:15",
            "group_name": "Consume"
          },
          {
            "name": "Evening Tooth Brushing",
            "item_type": "activity",
            "meta": "21:45",
            "group_name": "Clean"
          },
          {
            "name": "Gratitude Journal",
            "item_type": "activity",
            "meta": "21:50",
            "group_name": "Plan",
            "children": [
              "Write 3 specific gratitudes + name 1 person to forgive each evening.",
              "Unforgiveness raises cortisol and suppresses immunity. Gratitude does the opposite."
            ]
          },
          {
            "name": "Sleep in Complete Darkness",
            "item_type": "activity",
            "meta": "22:00",
            "group_name": "Wellness",
            "description": "Bed by 10pm.",
            "children": [
              "Sleep on left side",
              "Cool Bedroom",
              "Window cracked for fresh air",
              "Cover all LED lights",
              "In bed by 10pm",
              "No phones/WiFi in bedroom",
              "No screens 1-2h before bed",
              "Wear Natural Fibres",
              "Bedroom aired during the day"
            ]
          }
        ]
      },
      {
        "key": "self-heal-teen-male",
        "name": "Self Heal by Design — Teen Male",
        "chip": "Teen Male",
        "description": "A gentler version of Barbara O'Neill's Self Heal by Design protocol tailored for teen boys (13–19). Same plant-based, sun-based, sleep-based principles, with quantities and intensity scaled down for adolescent physiology: no extended fasting, fruit-rich breakfast, no caffeine, screen curfew 90 minutes before bed. Adds growth-window emphasis — heavier whole-protein intake (eggs, fish, lentils, pumpkin-seed protein), morning resistance training to drive growth-hormone and testosterone signalling, zinc-rich foods for skin and reproductive maturation, cold-water exposure for vagal tone, and 8.5+ hours of sleep (essential during the puberty growth surge). Why it matters: Barbara teaches that adolescent boys lay down lifelong bone density, mitochondrial capacity, gut integrity and circadian patterns during this decade — early adoption of the rhythm prevents the metabolic, mood and energy decline most men encounter in their thirties. Source: Self Heal by Design (book), chapters on growth, puberty and male development",
        "score": 86,
        "evidence": "moderate",
        "items": [
          {
            "name": "Gratitude on Waking",
            "item_type": "activity",
            "meta": "05:30",
            "group_name": "Plan",
            "children": [
              "Name three things you're grateful for before getting out of bed.",
              "The first thoughts of the day set the body's biochemistry for hours afterwards."
            ]
          },
          {
            "name": "Tongue Scraping",
            "item_type": "activity",
            "meta": "05:35",
            "group_name": "Clean",
            "children": [
              "Copper or stainless scraper, back to front, 5–10 strokes. Rinse between passes.",
              "Removes the overnight bacterial coating before you drink water — don't re-swallow it."
            ]
          },
          {
            "name": "Warm Lemon Water",
            "item_type": "consume",
            "meta": "05:40",
            "group_name": "Consume",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_warm_lemon_water-1779312331717.png",
            "children": [
              "Sip slowly, don't gulp",
              "Room temperature, not iced"
            ]
          },
          {
            "name": "Apple Cider Vinegar Tonic",
            "item_type": "supplement",
            "meta": "05:50",
            "group_name": "Supplement",
            "image_url": "https://www.trelune.com.au/cdn/shop/files/tre-lune-digest-tincture-barbara-oneill-australia-_Front.jpg?width=1024",
            "children": [
              "1 tbsp raw ACV (with the mother) in warm water, 20 min before meals.",
              "Primes stomach acid — low HCl is the hidden cause of most \"indigestion\" and reflux."
            ]
          },
          {
            "name": "Oil Pulling",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Clean",
            "children": [
              "Swish 1 tbsp cold-pressed coconut oil — pulls bacteria + biofilm from teeth & gums.",
              "Spit out (don't swallow) — the oil now carries pathogens you don't want re-absorbed.",
              "Rinse with warm salt water + brush after. Best done before food or coffee."
            ]
          },
          {
            "name": "Dry Skin Brushing",
            "item_type": "activity",
            "meta": "06:15",
            "group_name": "Wellness",
            "children": [
              "Use a natural bristle brush, always upward toward the heart — that's the direction of lymph flow.",
              "Pumps the lymphatic system, which has no heart-pump of its own. Skin is the third kidney.",
              "Do it dry, before showering, 3–5 minutes a day."
            ]
          },
          {
            "name": "Hot/Cold Contrast Shower",
            "item_type": "activity",
            "meta": "06:20",
            "group_name": "Wellness",
            "children": [
              "30 sec hot · 30 sec cold · repeat 3–5 cycles. Always finish on cold.",
              "Trains vascular tone, pumps lymph, raises norepinephrine for alertness.",
              "Cold finish activates brown fat and seals the skin closed against the day."
            ]
          },
          {
            "name": "Barefoot Grounding",
            "item_type": "activity",
            "meta": "06:30",
            "group_name": "Wellness"
          },
          {
            "name": "Morning Sunlight",
            "item_type": "activity",
            "meta": "06:35",
            "group_name": "Wellness",
            "children": [
              "No Sunglasses",
              "Skin Exposed"
            ]
          },
          {
            "name": "4-7-8 Breathing",
            "item_type": "activity",
            "meta": "06:55",
            "group_name": "Wellness",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_478_breathing.png",
            "children": [
              "Nasal breathing only",
              "Prefer outdoor / open window"
            ]
          },
          {
            "name": "Rebounding",
            "item_type": "activity",
            "meta": "07:00",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_rebounding.png",
            "children": [
              "Bounce gently 5–15 min. Even feet-on-mat counts. Most efficient lymphatic pump there is.",
              "Up-down gravity opens and closes the one-way lymph valves — nothing else moves lymph faster."
            ]
          },
          {
            "name": "Spinal Mobility",
            "item_type": "activity",
            "meta": "07:15",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_spinal_mobility.png"
          },
          {
            "name": "Beetroot",
            "item_type": "consume",
            "meta": "07:30",
            "group_name": "Consume",
            "image_url": "https://ermbkttsyvpenjjxaxcf.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/1773496422837-5a2ifn.jpg",
            "description": "Beet + Carrot + Greens Juice",
            "children": [
              "Raw or lightly steamed — betaine & betalains stimulate bile flow and thin sluggish bile."
            ]
          },
          {
            "name": "Freshly Ground Flaxseed",
            "item_type": "supplement",
            "meta": "07:45",
            "group_name": "Supplement"
          },
          {
            "name": "Soaked Oats with Berries, Flax & Raw Honey",
            "item_type": "consume",
            "meta": "08:00",
            "group_name": "Consume",
            "description": "Breakfast like a king.",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Brisk Walk After Breakfast",
            "item_type": "activity",
            "meta": "08:35",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_breakfast.png"
          },
          {
            "name": "Meditation",
            "item_type": "activity",
            "meta": "09:00",
            "group_name": "Plan"
          },
          {
            "name": "Big Rainbow Salad with Sprouts",
            "item_type": "consume",
            "meta": "12:30",
            "group_name": "Consume",
            "description": "Lunch like a prince.",
            "children": [
              "75% raw plant foods",
              "Chew Each Bite",
              "No water with meal",
              "Include bitter greens",
              "Include cruciferous veg"
            ]
          },
          {
            "name": "Brisk Walk After Lunch",
            "item_type": "activity",
            "meta": "13:15",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_lunch.png"
          },
          {
            "name": "Midday Sun for Vitamin D",
            "item_type": "activity",
            "meta": "14:00",
            "group_name": "Wellness",
            "children": [
              "Skin Exposed",
              "No sunscreen mid-day"
            ]
          },
          {
            "name": "Daily Nature Time",
            "item_type": "activity",
            "meta": "15:00",
            "group_name": "Plan"
          },
          {
            "name": "Infrared / Steam Sauna",
            "item_type": "activity",
            "meta": "16:00",
            "group_name": "Wellness",
            "description": "3-5x/week."
          },
          {
            "name": "Daily Outdoor Walk",
            "item_type": "activity",
            "meta": "17:00",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_daily_outdoor_walk.png",
            "children": [
              "30–60 min outdoors, ideally morning or late afternoon light.",
              "Walking pumps lymph, oxygenates blood, anchors hormones to the day-night cycle."
            ]
          },
          {
            "name": "Steamed Greens + Lentil Stew & Sauerkraut",
            "item_type": "consume",
            "meta": "18:00",
            "group_name": "Consume",
            "description": "Dinner like a pauper.",
            "children": [
              "Stop eating by 6pm",
              "Chew Each Bite",
              "No water with meal"
            ]
          },
          {
            "name": "Ginger Tea",
            "item_type": "consume",
            "meta": "18:30",
            "group_name": "Consume"
          },
          {
            "name": "Post-Dinner Walk",
            "item_type": "activity",
            "meta": "18:45",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_dinner.png"
          },
          {
            "name": "Castor Oil Pack on Liver",
            "item_type": "activity",
            "meta": "19:30",
            "group_name": "Wellness",
            "description": "3-5 nights per week.",
            "children": [
              "Wool flannel + cold-pressed castor oil + hot water bottle, 30–60 min on right side.",
              "Increases lymphocyte production, softens scar tissue, deeply relaxing for vagus nerve."
            ]
          },
          {
            "name": "Epsom Salt Bath",
            "item_type": "activity",
            "meta": "20:00",
            "group_name": "Wellness",
            "children": [
              "1–2 cups Epsom (magnesium sulfate) in a hot bath, 20 min. Skin absorbs the magnesium.",
              "Relaxes muscles, draws toxins through sweat, dramatically improves sleep onset."
            ]
          },
          {
            "name": "Magnesium Oil Spray",
            "item_type": "supplement",
            "meta": "20:30",
            "group_name": "Supplement",
            "image_url": "https://www.trelune.com.au/cdn/shop/files/earthbless-remineralize-magnesium-oil.jpg?width=1024",
            "children": [
              "5–10 sprays magnesium chloride on inner forearms or calves before bed.",
              "Transdermal bypasses poor gut absorption — relaxes muscles + nervous system for sleep."
            ]
          },
          {
            "name": "Turmeric Golden Milk",
            "item_type": "consume",
            "meta": "20:45",
            "group_name": "Consume"
          },
          {
            "name": "Chamomile / Passionflower Tea",
            "item_type": "consume",
            "meta": "21:15",
            "group_name": "Consume"
          },
          {
            "name": "Evening Tooth Brushing",
            "item_type": "activity",
            "meta": "21:45",
            "group_name": "Clean"
          },
          {
            "name": "Gratitude Journal",
            "item_type": "activity",
            "meta": "21:50",
            "group_name": "Plan",
            "children": [
              "Write 3 specific gratitudes + name 1 person to forgive each evening.",
              "Unforgiveness raises cortisol and suppresses immunity. Gratitude does the opposite."
            ]
          },
          {
            "name": "Sleep in Complete Darkness",
            "item_type": "activity",
            "meta": "22:00",
            "group_name": "Wellness",
            "description": "Bed by 10pm.",
            "children": [
              "Sleep on left side",
              "Cool Bedroom",
              "Window cracked for fresh air",
              "Cover all LED lights",
              "In bed by 10pm",
              "No phones/WiFi in bedroom",
              "No screens 1-2h before bed",
              "Wear Natural Fibres",
              "Bedroom aired during the day"
            ]
          }
        ]
      }
    ]
  },
  {
    "key": "weight-loss",
    "label": "Weight loss",
    "pillar": "Health",
    "protocols": [
      {
        "key": "weight-loss-caloric-deficit",
        "name": "Weight Loss — Caloric Deficit",
        "chip": "Caloric Deficit",
        "description": "A structured daily protocol combining intermittent fasting, HIIT training, strength work, and nutrient-dense meals to support sustainable fat loss while preserving lean muscle.\n\n**What it does to the body:**\n• Creates a 300-500 calorie daily deficit — the evidence-based sweet spot for fat loss without metabolic slowdown.\n• Morning fasted cardio (Zone 2) depletes liver glycogen overnight, forcing the body to oxidise stored fat as primary fuel.\n• HIIT sessions spike EPOC (excess post-exercise oxygen consumption), burning an additional 80-150 calories for 12-24 hours post-workout.\n• High-protein meals (40g+ per sitting) stimulate muscle protein synthesis via mTOR pathway, preventing lean mass loss during deficit.\n• Apple cider vinegar (1 tbsp) improves insulin sensitivity by 19-34% during high-carb meals (Johnston et al., 2004).\n• Post-dinner walking reduces postprandial glucose spikes by 30% (DiPietro et al., 2013).\n\n**Who created it:** Evidence-based protocol compiled from metabolic research by Dr. Layne Norton, Dr. Eric Helms, and ISSN position stands on fat loss.\n\n**Who it's for:** Adults 16+ with BMI >25 or those seeking body recomposition. Not suitable during pregnancy or for individuals with eating disorders.",
        "creator": "Evidence-based weight loss protocol",
        "source": "Evidence-based weight loss protocol",
        "evidence": "moderate",
        "score": 88,
        "items": [
          {
            "name": "Lemon Water",
            "item_type": "consume",
            "meta": "06:30",
            "group_name": "Morning Hydration",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/1772534033070-sy569t.jpg",
            "description": "500ml warm water, 1 tbsp ACV, juice of half lemon"
          },
          {
            "name": "Moderate Cardio",
            "item_type": "activity",
            "meta": "07:00",
            "group_name": "Fasted Cardio",
            "description": "Zone 2 heart rate, fat-burning zone"
          },
          {
            "name": "High-Protein Breakfast",
            "item_type": "consume",
            "meta": "10:00",
            "group_name": "Break Fast",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_highprotein-1779296976863.png",
            "description": "40g protein, healthy fats, low glycemic carbs",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Hiit All-Out",
            "item_type": "activity",
            "meta": "12:00",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_hiit_allout.png",
            "description": "Alternate HIIT and resistance training days",
            "children": [
              "Warm up 10 min",
              "Progressive overload",
              "Stretching"
            ]
          },
          {
            "name": "Post-Workout Shake",
            "item_type": "consume",
            "meta": "13:00",
            "group_name": "Recovery",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_shake_outshake-1779299107973.png",
            "description": "30g whey protein, banana, creatine 5g"
          },
          {
            "name": "Balanced Lunch",
            "item_type": "consume",
            "meta": "14:00",
            "group_name": "Meal",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_balanced-1779273480718.png",
            "description": "Lean protein, vegetables, complex carbs — 500 cal target",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Light Dinner",
            "item_type": "consume",
            "meta": "18:00",
            "group_name": "Meal",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_light-1779297531188.png",
            "description": "Protein + vegetables, minimal carbs — 400 cal target",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Evening Walk",
            "item_type": "activity",
            "meta": "19:30",
            "group_name": "Movement",
            "description": "10-minute post-dinner walk for digestion"
          }
        ]
      },
      {
        "key": "master-cleanse-lemonade-diet",
        "name": "Master Cleanse (lemonade Diet)",
        "chip": "Master Cleanse",
        "description": "Stanley Burroughs' original Master Cleanse from 1976 — a liquid fast using fresh lemon juice, grade B maple syrup, and cayenne pepper as the sole nutrition source for 10 days. The salt water flush each morning mechanically clears the entire digestive tract. Includes 3-day ease-in and 3-day ease-out phases.",
        "creator": "Stanley Burroughs",
        "evidence": "traditional",
        "days": 16,
        "score": 61,
        "items": [
          {
            "name": "Ease-In Day 1: Eliminate processed food, eat only whole foods",
            "item_type": "consume",
            "group_name": "Ease-In Phase",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_ease_in_day1_whole_foods-1779274840043.png",
            "description": "Cut all processed food, caffeine, alcohol, dairy, meat. Eat fruits, vegetables, soups, salads. Gradual reduction prevents severe detox headaches."
          },
          {
            "name": "Ease-In Day 2: Liquids and soups only",
            "item_type": "consume",
            "group_name": "Ease-In Phase",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_ease_in_day2_liquids_soups-1779274862079.png",
            "description": "Smoothies, fresh juices, broths, pureed soups. Digestive system starts downregulating enzyme production."
          },
          {
            "name": "Ease-In Day 3: Fresh orange juice all day",
            "item_type": "consume",
            "group_name": "Ease-In Phase",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_ease_in_day3_orange_juice-1779274897210.png",
            "description": "Fresh-squeezed OJ throughout the day. Completing the digestive transition to liquid only."
          },
          {
            "name": "Salt Water Flush",
            "item_type": "consume",
            "meta": "06:30",
            "group_name": "Morning",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_salt_water_flush-1779311644217.png",
            "description": "Mix 2 tsp non-iodized sea salt in 1 quart lukewarm water. Drink within 5 minutes on empty stomach. Salt concentration matches blood so it passes through entire tract. Expect full elimination within 30-60 min."
          },
          {
            "name": "Master Cleanse Lemonade",
            "item_type": "consume",
            "group_name": "All Day",
            "description": "Per serving: 2 tbsp fresh lemon juice, 2 tbsp Grade B maple syrup, 1/10 tsp cayenne, 8-10 oz water. Grade B maple syrup is critical — provides ~100 cal/serving of minerals."
          },
          {
            "name": "Herbal Laxative Tea",
            "item_type": "consume",
            "meta": "21:00",
            "group_name": "Night",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_herbal_laxative_tea-1779296727511.png",
            "description": "Smooth-move or senna tea before bed stimulates peristalsis overnight. Between morning salt flush and evening tea, digestive tract gets complete daily clearing."
          },
          {
            "name": "Drink Water",
            "item_type": "activity",
            "group_name": "All Day",
            "description": "Extra water supports kidneys processing increased waste from the fast. Herbal tea also fine."
          },
          {
            "name": "Walking",
            "item_type": "activity",
            "group_name": "All Day",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/walking.png",
            "description": "Body running on limited calories. Heavy exercise depletes glycogen reserves. Days 3-5 typically hardest before body adapts to fasting metabolism."
          },
          {
            "name": "Ease-Out Day 1: Fresh orange juice only",
            "item_type": "consume",
            "group_name": "Ease-Out Phase",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_ease_out_day1_orange_juice-1779274914298.png",
            "description": "After 10-day fast. OJ provides simple sugars while waking GI tract. DO NOT eat solid food — can cause severe cramping."
          },
          {
            "name": "Ease-Out Day 2: Soups and juices",
            "item_type": "consume",
            "group_name": "Ease-Out Phase",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_ease_out_day2_soups_juices-1779274956607.png",
            "description": "Vegetable soups, fresh juices, smoothies. Enzymes slowly ramping back up. Small meals, eaten slowly."
          },
          {
            "name": "Ease-Out Day 3: Light whole foods",
            "item_type": "consume",
            "group_name": "Ease-Out Phase",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_ease_out_day3_fruits_vegetables-1779295878074.png",
            "description": "Fresh fruits, salads, steamed vegetables, rice. Keep portions small. Powerful opportunity to reset food relationship."
          }
        ]
      }
    ]
  },
  {
    "key": "clearer-skin",
    "label": "Clearer skin",
    "pillar": "Beauty",
    "protocols": [
      {
        "key": "korean-glass-skin-ritual",
        "name": "Korean Glass Skin Ritual",
        "chip": "Glass Skin",
        "description": "The signature **glass skin** (유리 피부) ritual — the poreless, dewy, lit-from-within look associated with Korean celebrities. It's all about hydration layering.\n\n### The ritual\nDouble cleanse → gentle exfoliate → the 7-skin method (layer toner 3–7×) → snail-mucin essence → hyaluronic serum → moisturizer → a setting mist, finished at night with a sleeping mask.\n\n### Why it works\n**Glass skin is hydration, not coverage.** Patting many thin watery layers into damp skin plumps it from within so light bounces off an even, dewy surface.\n\nEducational beauty content reflecting popular Korean skincare practice — not medical advice.",
        "source": "Korean skincare (K-beauty) practice",
        "evidence": "moderate",
        "score": 81,
        "items": [
          {
            "name": "Oil Cleanse",
            "item_type": "activity",
            "meta": "07:00",
            "group_name": "Glass Skin Ritual"
          },
          {
            "name": "Water Cleanse",
            "item_type": "activity",
            "meta": "07:03",
            "group_name": "Glass Skin Ritual"
          },
          {
            "name": "Gentle Exfoliant",
            "item_type": "activity",
            "meta": "07:06",
            "group_name": "Glass Skin Ritual",
            "description": "1–2×/week."
          },
          {
            "name": "7-Skin Method",
            "item_type": "activity",
            "meta": "07:09",
            "group_name": "Glass Skin Ritual",
            "description": "The core glass-skin move."
          },
          {
            "name": "Snail Mucin Essence",
            "item_type": "activity",
            "meta": "07:14",
            "group_name": "Glass Skin Ritual"
          },
          {
            "name": "Hyaluronic Serum",
            "item_type": "activity",
            "meta": "07:17",
            "group_name": "Glass Skin Ritual"
          },
          {
            "name": "Moisturizer",
            "item_type": "activity",
            "meta": "07:20",
            "group_name": "Glass Skin Ritual"
          },
          {
            "name": "Setting Mist",
            "item_type": "activity",
            "meta": "07:23",
            "group_name": "Glass Skin Ritual"
          },
          {
            "name": "Gua Sha Massage",
            "item_type": "activity",
            "meta": "07:26",
            "group_name": "Glass Skin Ritual",
            "description": "De-puff and sculpt for glow."
          },
          {
            "name": "Sleeping Mask",
            "item_type": "activity",
            "meta": "21:30",
            "group_name": "Glass Skin Ritual",
            "description": "Night-time seal for glass skin."
          }
        ]
      },
      {
        "key": "k-beauty-morning-routine",
        "name": "K-Beauty Morning Routine",
        "chip": "K-Beauty AM",
        "description": "The Korean morning skincare routine — a light, hydration-first sequence that preps and protects skin for the day.\n\n### The order\nGentle cleanse, hydrating toner, essence, a brightening Vitamin C serum, eye cream, moisturizer, and — non-negotiable — SPF 50+.\n\n### Why it works\n**Mornings are about protection, not heavy treatment.** Light layers of hydration sit under sunscreen so skin stays dewy and defended all day. Pat each layer in; never rub.\n\nEducational beauty content reflecting popular Korean skincare practice — not medical advice.",
        "source": "Korean skincare (K-beauty) practice",
        "evidence": "moderate",
        "score": 76,
        "items": [
          {
            "name": "Gentle Morning Cleanse",
            "item_type": "activity",
            "meta": "06:30",
            "group_name": "Morning Skincare",
            "description": "A quick low-pH cleanse or just water — don't strip overnight repair."
          },
          {
            "name": "Hydrating Toner",
            "item_type": "activity",
            "meta": "06:33",
            "group_name": "Morning Skincare",
            "description": "Pat into damp skin."
          },
          {
            "name": "Essence",
            "item_type": "activity",
            "meta": "06:36",
            "group_name": "Morning Skincare"
          },
          {
            "name": "Vitamin C Serum",
            "item_type": "activity",
            "meta": "06:39",
            "group_name": "Morning Skincare",
            "description": "Antioxidant + brightening; boosts your SPF."
          },
          {
            "name": "Eye Cream",
            "item_type": "activity",
            "meta": "06:42",
            "group_name": "Morning Skincare"
          },
          {
            "name": "Moisturizer",
            "item_type": "activity",
            "meta": "06:45",
            "group_name": "Morning Skincare"
          },
          {
            "name": "Sunscreen SPF 50+",
            "item_type": "activity",
            "meta": "06:48",
            "group_name": "Morning Skincare",
            "description": "Never skip — the #1 anti-ageing step."
          }
        ]
      },
      {
        "key": "hailey-bieber-glazed-skin-routine",
        "name": "Hailey Bieber Glazed Skin Routine",
        "chip": "Hailey Bieber",
        "description": "The viral glazed donut skin protocol built on deep hydration, peptides, and barrier repair. Morning: gentle cleanser, niacinamide toner, hyaluronic acid serum, peptide moisturiser, SPF 50. Evening: double cleanse, retinol 0.5%, barrier cream, facial gua sha massage. The goal is lit-from-within luminosity, not heavy coverage.",
        "creator": "Hailey Bieber",
        "evidence": "moderate",
        "score": 77,
        "items": [
          {
            "name": "Micellar Water Cleanse",
            "item_type": "activity",
            "meta": "06:30",
            "group_name": "Morning Skincare",
            "description": "Start with 30 seconds and build tolerance gradually over several weeks"
          },
          {
            "name": "Vitamin C Brightening Serum",
            "item_type": "supplement",
            "meta": "06:33",
            "group_name": "Morning Skincare",
            "description": "15% L-Ascorbic"
          },
          {
            "name": "Hyaluronic Acid Hydrating Serum",
            "item_type": "activity",
            "meta": "06:35",
            "group_name": "Morning Skincare",
            "description": "Complete at the scheduled time for best habit formation"
          },
          {
            "name": "Peptide-Rich Moisturizer",
            "item_type": "activity",
            "meta": "06:37",
            "group_name": "Morning Skincare",
            "description": "glazed skin layer"
          },
          {
            "name": "Sunscreen Application",
            "item_type": "activity",
            "meta": "06:39",
            "group_name": "Morning Skincare",
            "description": "Complete at the scheduled time for best habit formation"
          },
          {
            "name": "Lip Gloss",
            "item_type": "activity",
            "meta": "06:41",
            "group_name": "Morning Skincare",
            "description": "Complete at the scheduled time for best habit formation"
          },
          {
            "name": "Face Mist Refresh",
            "item_type": "activity",
            "meta": "12:30",
            "group_name": "Midday Glow Refresh",
            "description": "rosewater"
          },
          {
            "name": "Spf Touch-Up Reapplication",
            "item_type": "activity",
            "meta": "13:00",
            "group_name": "Midday Glow Refresh",
            "description": "Complete at the scheduled time for best habit formation"
          },
          {
            "name": "Gua Sha Face Massage",
            "item_type": "activity",
            "meta": "13:05",
            "group_name": "Midday Glow Refresh",
            "description": "with oil"
          },
          {
            "name": "Oil Cleanser First Pass",
            "item_type": "activity",
            "meta": "20:30",
            "group_name": "Evening Skin Repair",
            "description": "double cleanse"
          },
          {
            "name": "Foaming Cleanser",
            "item_type": "activity",
            "meta": "20:33",
            "group_name": "Evening Skin Repair",
            "description": "Complete at the scheduled time for best habit formation"
          },
          {
            "name": "Retinol Serum 0.3% Application",
            "item_type": "activity",
            "meta": "20:35",
            "group_name": "Evening Skin Repair",
            "description": "Complete at the scheduled time for best habit formation"
          },
          {
            "name": "Niacinamide",
            "item_type": "activity",
            "meta": "20:37",
            "group_name": "Evening Skin Repair",
            "description": "Complete at the scheduled time for best habit formation",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom"
            ]
          },
          {
            "name": "Sleeping",
            "item_type": "activity",
            "meta": "20:39",
            "group_name": "Evening Skin Repair",
            "description": "barrier repair",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom",
              "Sleep"
            ]
          },
          {
            "name": "Eye Cream",
            "item_type": "activity",
            "meta": "20:41",
            "group_name": "Evening Skin Repair",
            "description": "caffeine + retinol complex"
          },
          {
            "name": "Collagen Peptides",
            "item_type": "supplement",
            "meta": "07:30",
            "group_name": "Beauty Supplement Stack",
            "image_url": "https://images.openfoodfacts.org/images/products/085/727/300/8666/front_en.223.400.jpg",
            "description": "10g, Type I + III"
          },
          {
            "name": "Biotin",
            "item_type": "supplement",
            "meta": "07:32",
            "group_name": "Beauty Supplement Stack",
            "description": "5000mcg — hair & skin | hair & skin)"
          },
          {
            "name": "Vitamin C",
            "item_type": "supplement",
            "meta": "07:33",
            "group_name": "Beauty Supplement Stack",
            "description": "1000mg — collagen synthesis | collagen synthesis)"
          },
          {
            "name": "Hyaluronic Acid Capsule",
            "item_type": "supplement",
            "meta": "07:34",
            "group_name": "Beauty Supplement Stack",
            "description": "200mg oral"
          },
          {
            "name": "Zinc",
            "item_type": "supplement",
            "meta": "07:35",
            "group_name": "Beauty Supplement Stack",
            "description": "15mg — acne + wound repair | acne + wound repair)"
          },
          {
            "name": "Beauty Water",
            "item_type": "consume",
            "meta": "08:00",
            "group_name": "Skin Nutrition",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_beauty_water_cucumber_rose_electrolytes-1779273515933.png",
            "description": "Drink slowly; room temperature water absorbs faster than cold"
          },
          {
            "name": "Lunch",
            "item_type": "consume",
            "meta": "12:30",
            "group_name": "Skin Nutrition",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_skinglow_lunch_salmon_avocado_mixed_greens-1779311704317.png",
            "description": "Add a small amount of healthy fat (avocado, olive oil) to improve vitamin absorption",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          }
        ]
      }
    ]
  },
  {
    "key": "lean-muscle",
    "label": "Lean muscle",
    "pillar": "Fitness",
    "protocols": [
      {
        "key": "muscle-gain-caloric-surplus",
        "name": "Muscle Gain — Caloric Surplus",
        "chip": "Caloric Surplus",
        "description": "A structured daily protocol with progressive overload training, caloric surplus meals, and recovery optimization to build lean muscle mass effectively.\n\n**What it does to the body:**\n• 300-500 calorie surplus provides the energy substrate required for muscle protein synthesis without excessive fat gain.\n• Progressive overload strength training (4-6 rep range) recruits Type II fast-twitch muscle fibres, maximising mechanical tension — the primary driver of hypertrophy.\n• 1.6-2.2g protein per kg bodyweight saturates muscle protein synthesis, with 50g post-workout triggering maximal mTOR activation.\n• Creatine monohydrate (5g daily) increases phosphocreatine stores by 20-40%, improving strength output and cell volumisation.\n• Casein protein before bed provides sustained amino acid release over 6-8 hours, reducing overnight muscle protein breakdown by 34% (Res et al., 2012).\n• Push/Pull/Legs split allows 48-72 hours recovery per muscle group — optimal for satellite cell repair and supercompensation.\n\n**Who created it:** Based on research by Dr. Brad Schoenfeld (hypertrophy science), Dr. Eric Helms (The Muscle & Strength Pyramid), and NSCA guidelines.\n\n**Who it's for:** Adults 16+ looking to gain lean muscle mass. Requires access to a gym with free weights and machines.",
        "creator": "Evidence-based hypertrophy protocol",
        "source": "Evidence-based hypertrophy protocol",
        "evidence": "moderate",
        "score": 85,
        "items": [
          {
            "name": "Pre-Breakfast Shake",
            "item_type": "consume",
            "meta": "06:30",
            "group_name": "Morning Fuel",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_shake-1779311684427.png",
            "description": "40g whey, oats, banana, peanut butter — 600 cal",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "High-Calorie Breakfast",
            "item_type": "consume",
            "meta": "07:30",
            "group_name": "Meal",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_highcalorie-1779296886293.png",
            "description": "Eggs, toast, avocado, fruit — 700 cal, 45g protein",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Mid-Morning Snack",
            "item_type": "consume",
            "meta": "10:00",
            "group_name": "Snack",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_mid_morning_snack-1779298221931.png",
            "description": "Greek yogurt, granola, mixed nuts — 400 cal",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Strength Training",
            "item_type": "activity",
            "meta": "11:00",
            "group_name": "Strength",
            "description": "Push/Pull/Legs split, 4-6 rep range compound lifts",
            "children": [
              "Warm up 10 min",
              "Progressive overload",
              "Stretching"
            ]
          },
          {
            "name": "Post-Workout Meal",
            "item_type": "consume",
            "meta": "12:30",
            "group_name": "Recovery",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_meal-1779299038100.png",
            "description": "50g protein, 80g carbs, creatine 5g — 800 cal",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Lunch",
            "item_type": "consume",
            "meta": "15:00",
            "group_name": "Meal",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_lunch-1779297704451.png",
            "description": "Rice, chicken, vegetables — 700 cal",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Dinner",
            "item_type": "consume",
            "meta": "19:00",
            "group_name": "Dinner",
            "description": "Steak/salmon, sweet potato, greens — 700 cal"
          },
          {
            "name": "Before Bed Casein Shake",
            "item_type": "consume",
            "meta": "21:30",
            "group_name": "Night Recovery",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_before_bed_casein_shake-1779273550942.png",
            "description": "30g casein protein, milk — slow digestion overnight"
          }
        ]
      },
      {
        "key": "the-rock-iron-paradise-workout",
        "name": "The Rock Iron Paradise Workout",
        "chip": "The Rock",
        "description": "Iron Paradise 6-day split: 30-60 min fasted cardio every morning, then heavy weight training. Rotating push/pull/legs with high volume. Sunday is cheat meal and active recovery day.",
        "creator": "Dwayne Johnson",
        "evidence": "high",
        "score": 86,
        "items": [
          {
            "name": "Wake 4am",
            "item_type": "activity",
            "meta": "04:00",
            "group_name": "Fasted AM Cardio",
            "description": "first thought is the workout, nothing else"
          },
          {
            "name": "Pre-Cardio",
            "item_type": "consume",
            "meta": "04:03",
            "group_name": "Fasted AM Cardio",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_pre_cardio_meal-1779310820993.png",
            "description": "1L water, BCAAs or electrolytes only"
          },
          {
            "name": "Incline Treadmill",
            "item_type": "activity",
            "meta": "04:10",
            "group_name": "Fasted AM Cardio",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_protocol_incline_treadmill_5_degree_incline_32_mph_4050_min_fas.png",
            "description": "5 degree incline, 3.2 mph, 40-50 min fasted"
          },
          {
            "name": "Breakfast",
            "item_type": "consume",
            "meta": "05:00",
            "group_name": "Meal",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_egg_whites_whole_eggs_oatmeal-1779273724823.png",
            "description": "10 egg whites, 2 whole eggs, 2 cups oatmeal, 1 cup papaya",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Second Meal",
            "item_type": "consume",
            "meta": "08:00",
            "group_name": "Meal",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_second_meal-1779311663694.png",
            "description": "8oz cod, 2 cups rice, 2 cups veg, 1 tbsp fish oil",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Barbell Back Squat",
            "item_type": "activity",
            "meta": "09:30",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_barbell_back_squat.png",
            "description": "4 sets x 12 reps, deep, controlled"
          },
          {
            "name": "Leg Press",
            "item_type": "activity",
            "meta": "09:50",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_protocol_leg_press_4_sets_x_25_reps_high_foot_placement.png",
            "description": "4 sets x 25 reps, high foot placement"
          },
          {
            "name": "Leg Extension",
            "item_type": "activity",
            "meta": "10:05",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_protocol_leg_extension_3_sets_x_20_reps_full_extension.png",
            "description": "3 sets x 20 reps, full extension"
          },
          {
            "name": "Romanian Deadlift",
            "item_type": "activity",
            "meta": "10:15",
            "group_name": "Strength",
            "description": "3 sets x 15 reps, hamstring focus",
            "children": [
              "Warm up 10 min",
              "Progressive overload",
              "Stretching"
            ]
          },
          {
            "name": "Walking Lunges",
            "item_type": "activity",
            "meta": "10:27",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/walking.png",
            "description": "3 sets x 20 reps per leg, weighted"
          },
          {
            "name": "Standing Calf Raises",
            "item_type": "activity",
            "meta": "10:39",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_calf_raise.png",
            "description": "4 sets x 20 reps, pause at top"
          },
          {
            "name": "Core Circuit",
            "item_type": "activity",
            "meta": "10:50",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_hanging_leg_raise.png",
            "description": "hanging leg raises, cable crunches, planks"
          },
          {
            "name": "Post-Workout Shake",
            "item_type": "consume",
            "meta": "11:10",
            "group_name": "Nutrition",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_shake_outshake-1779299107973.png",
            "description": "60g whey, banana, almond butter"
          },
          {
            "name": "Sunday Cheat Meal",
            "item_type": "consume",
            "meta": "12:00",
            "group_name": "Sunday Tradition",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/assets/images/recipes/meal_united_states_main_breakfast_pancakes/0_3.jpg",
            "description": "pancakes, pizza, brownies — earn it",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Pre-Workout Stimulant",
            "item_type": "supplement",
            "meta": "03:30",
            "group_name": "Performance Supplements",
            "description": "C4 or ZOA Energy"
          },
          {
            "name": "Intra-Workout Bcaas",
            "item_type": "supplement",
            "meta": "05:00",
            "group_name": "Performance Supplements",
            "description": "10g"
          },
          {
            "name": "Post-Workout Whey Isolate",
            "item_type": "supplement",
            "meta": "07:00",
            "group_name": "Performance Supplements",
            "description": "60g"
          },
          {
            "name": "Creatine Hcl",
            "item_type": "supplement",
            "meta": "07:05",
            "group_name": "Performance Supplements",
            "description": "5g"
          }
        ]
      },
      {
        "key": "functional-training-circuit",
        "name": "Functional Training Circuit",
        "chip": "Functional",
        "description": "A full-body functional circuit built on the five fundamental movement patterns — squat, hinge, push, pull, and carry. Trains strength that transfers to everyday movement; scalable from bodyweight to loaded.",
        "creator": "HealthScan",
        "evidence": "moderate",
        "days": 1,
        "items": [
          {
            "name": "Dynamic Warm-Up",
            "item_type": "activity",
            "meta": "07:00",
            "group_name": "Do",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_dynamic_warmup.png",
            "description": "Warm up: 3 minutes of easy movement — arm circles, leg swings, bodyweight squats."
          },
          {
            "name": "Goblet Squat",
            "item_type": "activity",
            "meta": "07:03",
            "group_name": "Do",
            "description": "Squat pattern: goblet squat (or bodyweight squat).  1 sets × 12 reps.  Tip: Keep heels down and chest tall."
          },
          {
            "name": "Romanian Deadlift",
            "item_type": "activity",
            "meta": "07:06",
            "group_name": "Do",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_func_romanian_deadlift.png",
            "description": "Hinge pattern: kettlebell/dumbbell Romanian deadlift.  1 sets × 10 reps.  Tip: Push the hips back; keep a flat back."
          },
          {
            "name": "Push-Ups",
            "item_type": "activity",
            "meta": "07:09",
            "group_name": "Do",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_func_push_ups.png",
            "description": "Push pattern: push-ups (incline to scale).  1 sets × 10 reps."
          },
          {
            "name": "Bent-Over Row",
            "item_type": "activity",
            "meta": "07:12",
            "group_name": "Do",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_func_bent_over_row.png",
            "description": "Pull pattern: bent-over row (band, dumbbell, or barbell).  1 sets × 10 reps."
          },
          {
            "name": "Farmer's Carry",
            "item_type": "activity",
            "meta": "07:15",
            "group_name": "Do",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_func_farmers_carry.png",
            "description": "Carry: farmer's carry with heavy dumbbells, 30-40 metres.  Tip: Stand tall — no leaning."
          },
          {
            "name": "Functional Circuit Round",
            "item_type": "activity",
            "meta": "07:16",
            "group_name": "Do",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_func_circuit_round.png",
            "description": "Rest 90 seconds, then repeat the circuit. 3 rounds total."
          }
        ]
      }
    ]
  },
  {
    "key": "more-energy",
    "label": "More energy",
    "pillar": "Health",
    "protocols": [
      {
        "key": "optimal-morning-routine",
        "name": "Optimal Morning Routine",
        "chip": "Optimal Morning",
        "description": "A science-backed morning protocol combining light exposure, cold therapy, mindfulness, movement, and nutrition to maximize energy, focus, and hormonal balance for the day ahead.\n\n**Morning Flow:**\n• 6:00 AM - Wake up with natural light exposure\n• 6:15 AM - Cold shower or cold plunge (2-3 min)\n• 6:30 AM - 10 min meditation/breathwork\n• 6:45 AM - Light movement/stretching (15 min)\n• 7:00 AM - Hydration + electrolytes\n• 7:15 AM - Nutrient-dense breakfast\n• 7:45 AM - Morning sunlight walk (20 min)\n• 8:15 AM - Caffeine (if desired) + deep work block\n\n**Benefits:**\n- Regulates circadian rhythm\n- Boosts dopamine and alertness\n- Supports metabolic health\n- Enhances cognitive performance",
        "creator": "Optimal Morning Protocol",
        "source": "Optimal Morning Protocol",
        "evidence": "moderate",
        "days": 1,
        "score": 92,
        "items": [
          {
            "name": "Sunlight Exposure",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Wake",
            "description": "Get outside within 30 min of waking — sets circadian rhythm"
          },
          {
            "name": "Hydrate",
            "item_type": "consume",
            "meta": "06:15",
            "group_name": "Hydration",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_water-1779312389745.png",
            "description": "500ml water + pinch of sea salt — electrolyte balance"
          },
          {
            "name": "Cold Plunge",
            "item_type": "activity",
            "meta": "06:20",
            "group_name": "Cold Therapy",
            "description": "1-3 min cold water — dopamine + norepinephrine spike"
          },
          {
            "name": "Meditation",
            "item_type": "activity",
            "meta": "06:30",
            "group_name": "Mindfulness",
            "description": "Box breathing or Wim Hof method"
          },
          {
            "name": "Movement / Exercise",
            "item_type": "activity",
            "meta": "06:45",
            "group_name": "Exercise",
            "description": "Zone 2 cardio or resistance training"
          },
          {
            "name": "Protein-Rich Breakfast",
            "item_type": "consume",
            "meta": "08:00",
            "group_name": "Meal",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_proteinrich-1779311257742.png",
            "description": "30-40g protein first meal — supports muscle and focus",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Morning Supplements",
            "item_type": "supplement",
            "meta": "08:15",
            "group_name": "Supplement",
            "image_url": "https://images.openfoodfacts.org/images/products/000/001/256/2213/front_en.49.400.jpg",
            "description": "Vitamin D 5000 IU, Omega-3 2g, Magnesium 400mg"
          },
          {
            "name": "Delay caffeine 90-120 min",
            "item_type": "consume",
            "meta": "08:30",
            "group_name": "Caffeine",
            "description": "Wait 90+ min after waking — prevents afternoon crash"
          }
        ]
      },
      {
        "key": "wim-hof-breathing-cold-method",
        "name": "Wim Hof Breathing & Cold Method",
        "chip": "Wim Hof",
        "description": "The Iceman's clinically-proven protocol: 3 rounds of 30-40 power breaths (hyperventilation) followed by breath retention after exhale, then recovery breath hold. Followed by cold shower or ice bath. Proven in peer-reviewed studies to consciously influence immune response, reduce inflammation, and flood the body with energy. Start with 30 sec cold, build to 5+ minutes.",
        "creator": "Wim Hof",
        "evidence": "high",
        "score": 89,
        "items": [
          {
            "name": "30 Power Breaths",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Breathing Foundation",
            "description": "Find a quiet space; consistency matters more than duration"
          },
          {
            "name": "Recovery Breath",
            "item_type": "activity",
            "meta": "06:05",
            "group_name": "Breathing Foundation",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_protocol_round_2_recovery_breath.png",
            "description": "15-sec hold on inhale"
          },
          {
            "name": "30 Power Breaths",
            "item_type": "activity",
            "meta": "06:07",
            "group_name": "Breathing Foundation",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_protocol_round_2_30_power_breaths_extended_retention_hold.png",
            "description": "Find a quiet space; consistency matters more than duration"
          },
          {
            "name": "Recovery Breath",
            "item_type": "activity",
            "meta": "06:13",
            "group_name": "Breathing Foundation",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_protocol_round_2_recovery_breath.png",
            "description": "Find a quiet space; consistency matters more than duration"
          },
          {
            "name": "30 Power Breaths",
            "item_type": "activity",
            "meta": "06:15",
            "group_name": "Breathing Foundation",
            "description": "Find a quiet space; consistency matters more than duration"
          },
          {
            "name": "Recovery Breath & Rest",
            "item_type": "activity",
            "meta": "06:22",
            "group_name": "Breathing Foundation",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_protocol_round_3_recovery_breath_rest.png",
            "description": "Find a quiet space; consistency matters more than duration"
          },
          {
            "name": "Cold Shower",
            "item_type": "activity",
            "meta": "06:30",
            "group_name": "Cold Exposure",
            "description": "Gradual 2-min Cold Exposure"
          },
          {
            "name": "Ice Bath Full Immersion",
            "item_type": "activity",
            "meta": "06:40",
            "group_name": "Cold Exposure",
            "description": "37–60 seconds to start"
          },
          {
            "name": "Wim Hof Controlled Breathing During Cold",
            "item_type": "activity",
            "meta": "06:42",
            "group_name": "Cold Exposure",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_protocol_wim_hof_controlled_breathing_during_cold.png",
            "description": "Find a quiet space; consistency matters more than duration"
          },
          {
            "name": "Post-Cold Warm-Up & Body Scan",
            "item_type": "activity",
            "meta": "06:45",
            "group_name": "Cold Exposure",
            "description": "Start with 30 seconds and build tolerance gradually over several weeks"
          },
          {
            "name": "Meditation",
            "item_type": "activity",
            "meta": "07:00",
            "group_name": "Mental Conditioning",
            "description": "Find a quiet space; consistency matters more than duration"
          },
          {
            "name": "Commitment Affirmation & Mental Visualization",
            "item_type": "activity",
            "meta": "07:10",
            "group_name": "Mental Conditioning",
            "description": "Write 3 specific things; specificity makes gratitude practice more effective"
          },
          {
            "name": "Shower",
            "item_type": "activity",
            "meta": "17:00",
            "group_name": "Mental Conditioning",
            "description": "Find a quiet space; consistency matters more than duration"
          },
          {
            "name": "Breath Retention Progress Log",
            "item_type": "activity",
            "meta": "21:00",
            "group_name": "Mental Conditioning",
            "description": "Find a quiet space; consistency matters more than duration"
          },
          {
            "name": "Sleep",
            "item_type": "activity",
            "meta": "21:30",
            "group_name": "Mental Conditioning",
            "description": "3 rounds",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom"
            ]
          },
          {
            "name": "Vitamin D3",
            "item_type": "supplement",
            "meta": "07:30",
            "group_name": "Performance Supplements",
            "description": "5000 IU"
          },
          {
            "name": "Adaptogens",
            "item_type": "supplement",
            "meta": "07:31",
            "group_name": "Performance Supplements",
            "description": "400mg"
          },
          {
            "name": "Electrolytes",
            "item_type": "supplement",
            "meta": "07:32",
            "group_name": "Performance Supplements",
            "description": "Take 30–60 min before bed for best results"
          },
          {
            "name": "Pre-Breathing Hydration",
            "item_type": "consume",
            "meta": "05:50",
            "group_name": "Pre-Protocol Nutrition",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_prebreathing_hydration_500ml_warm_water-1779299295267.png",
            "description": "Drink slowly; room temperature water absorbs faster than cold"
          },
          {
            "name": "Post-cold Meal",
            "item_type": "consume",
            "meta": "07:45",
            "group_name": "Pre-Protocol Nutrition",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_postcold_meal_protein_healthy_fats_recovery-1779298696968.png",
            "description": "recovery",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          }
        ]
      },
      {
        "key": "5am-club",
        "name": "5am Club",
        "chip": "5am Club",
        "description": "Wake at 5am: 20 min vigorous exercise (Victory Hour), 20 min reflection and journaling, 20 min learning. The 20/20/20 formula used by world-class performers.",
        "creator": "Robin Sharma",
        "evidence": "high",
        "score": 86,
        "items": [
          {
            "name": "Wake at 5am Sharp",
            "item_type": "activity",
            "meta": "05:00",
            "group_name": "Move (20 min)",
            "description": "alarm across the room if needed"
          },
          {
            "name": "Vigorous Exercise",
            "item_type": "activity",
            "meta": "05:02",
            "group_name": "Move (20 min)",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_sprint_intervals.png",
            "description": "HIIT, sprint intervals, heavy weights or run"
          },
          {
            "name": "Focused Meditation",
            "item_type": "activity",
            "meta": "05:22",
            "group_name": "Reflect (20 min)",
            "description": "single-point breath or mantra focus"
          },
          {
            "name": "Gratitude Journaling",
            "item_type": "activity",
            "meta": "05:32",
            "group_name": "Reflect (20 min)",
            "description": "write future self letter"
          },
          {
            "name": "Vision Journaling",
            "item_type": "activity",
            "group_name": "Reflect (20 min)"
          },
          {
            "name": "Read 10 Pages of World-Class Non-Fiction",
            "item_type": "activity",
            "meta": "05:42",
            "group_name": "Grow (20 min)",
            "description": "Complete at the scheduled time for best habit formation"
          },
          {
            "name": "Educational Podcast or Masterclass Audio",
            "item_type": "activity",
            "meta": "05:54",
            "group_name": "Grow (20 min)",
            "description": "Complete at the scheduled time for best habit formation"
          },
          {
            "name": "Hydration",
            "item_type": "consume",
            "meta": "05:00",
            "group_name": "Nutrition",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_hydration_3_litres-1779297067910.png",
            "description": "500ml water before anything else"
          },
          {
            "name": "Nutritious Breakfast",
            "item_type": "consume",
            "meta": "06:05",
            "group_name": "Nutrition",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_nutritious_breakfast-1779298387552.png",
            "description": "protein, healthy fats, complex carbs",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Green Tea Extract",
            "item_type": "supplement",
            "meta": "05:00",
            "group_name": "Morning Supplement Ritual",
            "description": "500mg, antioxidant focus"
          },
          {
            "name": "Vitamin B-Complex",
            "item_type": "supplement",
            "meta": "05:01",
            "group_name": "Morning Supplement Ritual",
            "description": "mental energy"
          },
          {
            "name": "Lion's Mane Mushroom",
            "item_type": "supplement",
            "meta": "05:02",
            "group_name": "Morning Supplement Ritual",
            "description": "500mg, cognitive clarity"
          },
          {
            "name": "Magnesium Glycinate",
            "item_type": "supplement",
            "meta": "05:03",
            "group_name": "Morning Supplement Ritual",
            "description": "relaxed focus"
          },
          {
            "name": "Hot Lemon Water",
            "item_type": "consume",
            "meta": "05:00",
            "group_name": "Morning Nourishment",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_hot_lemon_water_with_himalayan_salt-1779297025645.png",
            "description": "Drink slowly; room temperature water absorbs faster than cold"
          },
          {
            "name": "Morning Mindset Meal",
            "item_type": "consume",
            "meta": "07:00",
            "group_name": "Morning Nourishment",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_mindset_meal_avocado_eggs_berries-1779298272554.png",
            "description": "Prepare fresh where possible; track intake as part of your routine",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          }
        ]
      }
    ]
  },
  {
    "key": "better-sleep",
    "label": "Better sleep",
    "pillar": "Health",
    "protocols": [
      {
        "key": "matthew-walker-sleep-protocol",
        "name": "Matthew Walker Sleep Protocol",
        "chip": "Matthew Walker",
        "description": "Cool bedroom to 18-19 C (65-67 F), complete blackout curtains, no alcohol (disrupts REM), consistent bed and wake times 7 days/week, no screens 1 hr before bed. Based on peer-reviewed sleep science.",
        "creator": "Matthew Walker",
        "evidence": "high",
        "score": 96,
        "items": [
          {
            "name": "Last caffeine no later than 2pm",
            "item_type": "activity",
            "meta": "14:00",
            "group_name": "All Day",
            "description": "half-life is 5-6 hours"
          },
          {
            "name": "No alcohol",
            "item_type": "activity",
            "meta": "00:00",
            "group_name": "All Day",
            "description": "destroys REM sleep, wakes you 4-5 hours in"
          },
          {
            "name": "Stop all screens 1 hour before bed",
            "item_type": "activity",
            "meta": "21:00",
            "group_name": "Wind-Down",
            "description": "melatonin killer"
          },
          {
            "name": "Light Reading Under Warm 40w Lamp or Candle",
            "item_type": "activity",
            "meta": "21:05",
            "group_name": "Wind-Down",
            "description": "Complete at the scheduled time for best habit formation"
          },
          {
            "name": "Set Bedroom Thermostat to 18-19 C",
            "item_type": "activity",
            "meta": "21:50",
            "group_name": "Sleep Hygiene",
            "description": "Complete at the scheduled time for best habit formation"
          },
          {
            "name": "Sleep",
            "item_type": "activity",
            "meta": "21:52",
            "group_name": "Sleep Hygiene",
            "description": "total darkness",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom"
            ]
          },
          {
            "name": "Progressive Muscle Relaxation",
            "item_type": "activity",
            "meta": "21:54",
            "group_name": "Sleep Hygiene",
            "description": "tense and release each body part"
          },
          {
            "name": "Sleep",
            "item_type": "activity",
            "meta": "22:00",
            "group_name": "Sleep",
            "description": "consistent 10pm bedtime every night including weekends",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom"
            ]
          },
          {
            "name": "Wake at SAMe Time Every Day",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Wake",
            "description": "even weekends, no snooze"
          },
          {
            "name": "Avoid naps after 3pm",
            "item_type": "activity",
            "meta": "00:00",
            "group_name": "All Day",
            "description": "tanks sleep pressure at night"
          },
          {
            "name": "Magnesium Glycinate",
            "item_type": "supplement",
            "meta": "21:00",
            "group_name": "Sleep Supplement Stack",
            "description": "400mg — sleep onset | sleep onset)"
          },
          {
            "name": "Glycine",
            "item_type": "supplement",
            "meta": "21:01",
            "group_name": "Sleep Supplement Stack",
            "description": "3g — deeper sleep quality | deeper sleep quality)"
          },
          {
            "name": "Apigenin",
            "item_type": "supplement",
            "meta": "21:02",
            "group_name": "Sleep Supplement Stack",
            "description": "50mg — calming, from chamomile | calming, from chamomile)"
          },
          {
            "name": "Low-Dose Melatonin",
            "item_type": "supplement",
            "meta": "21:03",
            "group_name": "Sleep Supplement Stack",
            "description": "0.3mg, not 10mg",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom"
            ]
          },
          {
            "name": "Theanine",
            "item_type": "supplement",
            "meta": "21:04",
            "group_name": "Sleep Supplement Stack",
            "description": "200mg — reduces sleep latency | reduces sleep latency)"
          },
          {
            "name": "Chamomile or Tart Cherry Juice",
            "item_type": "consume",
            "meta": "20:30",
            "group_name": "Evening Nutrition",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_chamomile_or_tart_cherry_juice_sleep_tryptophan-1779295740776.png",
            "description": "sleep tryptophan"
          },
          {
            "name": "Light Pre-sleep Snack",
            "item_type": "consume",
            "meta": "20:45",
            "group_name": "Evening Nutrition",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_light_presleep_snack_kiwi_almonds_if_hungry-1779297598060.png",
            "description": "if hungry",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom"
            ]
          }
        ]
      },
      {
        "key": "evening-wind-down",
        "name": "Evening Wind-Down",
        "chip": "Wind-Down",
        "description": "A structured 90-minute pre-sleep protocol that lowers cortisol, supports deep sleep stages and reduces stress before bed. The most impactful thing you can do for next-day performance.\n\n**Sequence (8:00–9:30 PM):**\n• 8:00 PM – Magnesium Glycinate 400 mg + Ashwagandha 300 mg\n• 8:30 PM – Switch to blue-light-blocking glasses or warm lighting\n• 9:00 PM – Gentle yoga / yin stretch (10 min)\n• 9:30 PM – Evening journaling (gratitude + tomorrow's top 3 priorities)\n\n**The science:**\n- Magnesium activates GABA receptors — the brain's primary inhibitory neurotransmitter\n- Ashwagandha reduces cortisol by ~15–30% and improves sleep quality in double-blind trials\n- Blue light at night suppresses melatonin by up to 50% — amber glasses restore melatonin timing\n- 3–5 gratitude items before sleep reduce anxiety and improve morning mood",
        "creator": "Evening Wind-Down Protocol",
        "source": "Evening Wind-Down Protocol",
        "evidence": "moderate",
        "days": 1,
        "score": 86,
        "items": [
          {
            "name": "View Sunset or Step Outside at Dusk",
            "item_type": "activity",
            "meta": "19:00",
            "group_name": "Light Management",
            "description": "anchors circadian rhythm"
          },
          {
            "name": "Dim All Overhead Lights",
            "item_type": "activity",
            "meta": "20:00",
            "group_name": "Light Management",
            "description": "switch to warm amber lamps or candles"
          },
          {
            "name": "Blue-Light Blocking Glasses",
            "item_type": "activity",
            "meta": "20:05",
            "group_name": "Light Management",
            "description": "Complete at the scheduled time for best habit formation"
          },
          {
            "name": "Magnesium L-Threonate 300-400mg",
            "item_type": "supplement",
            "meta": "21:00",
            "group_name": "Supplement Stack",
            "description": "promotes sleep depth"
          },
          {
            "name": "L-Theanine 200mg",
            "item_type": "supplement",
            "meta": "21:00",
            "group_name": "Supplement Stack",
            "description": "reduces anxiety and improves sleep quality"
          },
          {
            "name": "Apigenin 50mg",
            "item_type": "supplement",
            "meta": "21:00",
            "group_name": "Supplement Stack",
            "description": "chamomile extract, reduces cortisol"
          },
          {
            "name": "Screen-Free Wind-Down",
            "item_type": "activity",
            "meta": "21:05",
            "group_name": "Wind-Down",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_gentle_yoga.png",
            "description": "read, journal or gentle yoga stretching",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom"
            ]
          },
          {
            "name": "Yoga Nidra",
            "item_type": "activity",
            "meta": "21:35",
            "group_name": "Wind-Down",
            "description": "not sleep, body scan rest"
          },
          {
            "name": "Sleep",
            "item_type": "activity",
            "meta": "21:55",
            "group_name": "Sleep",
            "description": "sleep quality peaks at lower temperature"
          },
          {
            "name": "Sleep",
            "item_type": "activity",
            "meta": "22:00",
            "group_name": "Sleep",
            "description": "target 7-9 hours, consistent bedtime every night",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom"
            ]
          },
          {
            "name": "Anti-Inflammatory Dinner",
            "item_type": "consume",
            "meta": "18:30",
            "group_name": "Evening Nutrition",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_pan_seared_salmon_with_olive_oil_and_leafy_greens-1779298461608.png",
            "description": "salmon, olive oil, leafy greens",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Herbal Adaptogen Tea",
            "item_type": "consume",
            "meta": "20:30",
            "group_name": "Evening Nutrition",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_herbal_adaptogen_tea-1779296671719.png",
            "description": "Ashwagandha or Reishi blend"
          }
        ]
      }
    ]
  },
  {
    "key": "gut-health",
    "label": "Gut health",
    "pillar": "Health",
    "protocols": [
      {
        "key": "gut-healing",
        "name": "Gut Healing",
        "chip": "Gut Healing",
        "description": "Barbara O'Neill's 4-to-8-week protocol to heal and seal the gut lining — her standard answer to leaky gut, IBS, food sensitivities, autoimmunity, and chronic skin conditions. Builds on the 4-R framework: Remove (sugar, gluten, dairy, seed oils, alcohol, NSAIDs), Replace (digestive bitters, betaine HCl, digestive enzymes), Reinoculate (kefir, sauerkraut, kimchi, fibre-rich plants), Repair (bone broth, slippery elm, marshmallow root, aloe vera juice, L-glutamine, zinc carnosine, vitamin D). Adds intermittent fasting to give the gut digestive rest, stress regulation (the vagus nerve runs gut motility), and circadian-aligned eating. Why it matters: Barbara teaches the gut wall is the single most important barrier in the body — once it leaks, every downstream system (immune, hormonal, cognitive, skin) follows it into dysfunction. Source: Self Heal by Design (book) + \"Sustain Me\" (sequel), chapter on the gut-mucosal barrier.",
        "creator": "Barbara O'Neill",
        "source": "Barbara O'Neill — Self Heal by Design",
        "evidence": "moderate",
        "score": 85,
        "items": [
          {
            "name": "Bone broth",
            "item_type": "consume",
            "meta": "08:00",
            "group_name": "Gut",
            "children": [
              "Slowly simmered bone broth, sipped warm. Amino acids absorbed without taxing digestion.",
              "Glycine + collagen + minerals rebuild the gut wall and the mucus barriers that clear infection."
            ]
          },
          {
            "name": "Slippery elm before meals",
            "item_type": "supplement",
            "meta": "11:30",
            "group_name": "Gut",
            "image_url": "https://www.trelune.com.au/cdn/shop/files/tre-lune-colon-support-tincture-gut-health-digestion.jpg?width=1024",
            "children": [
              "1 tsp slippery elm bark powder in warm water, 20 min before each meal.",
              "Coats the gut lining with a soothing mucilage gel; gentle for inflamed colitis or IBS."
            ]
          },
          {
            "name": "Fermented Foods",
            "item_type": "consume",
            "meta": "12:30",
            "group_name": "Gut",
            "description": "Fermented foods (sauerkraut / kefir)",
            "children": [
              "1–2 tbsp raw sauerkraut, kefir or kimchi with one meal a day.",
              "Live probiotic strains; crowds out pathogenic gut bacteria."
            ]
          },
          {
            "name": "Aloe vera juice",
            "item_type": "consume",
            "meta": "16:00",
            "group_name": "Gut",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/assets/images/recipes/beverage_water_aloe_vera/0_2.jpg",
            "children": [
              "30–60 ml inner-leaf aloe juice (no aloin), on empty stomach in the morning.",
              "Soothes inflamed gut, aids elimination, supplies polysaccharides for immune cells."
            ]
          },
          {
            "name": "L-glutamine",
            "item_type": "supplement",
            "meta": "20:00",
            "group_name": "Gut",
            "children": [
              "5 g L-glutamine powder in water, on empty stomach, twice daily.",
              "Primary fuel for gut-lining cells; repairs leaky gut and reduces sugar cravings."
            ]
          }
        ]
      },
      {
        "key": "candida-cleanse-protocol",
        "name": "Candida Cleanse Protocol",
        "chip": "Candida Cleanse",
        "description": "A targeted anti-candida protocol combining potent natural antifungals with biofilm disruptors and probiotics over 8 weeks. Candida overgrowth hides behind protective biofilm — this protocol breaks through that shield with enzymes like nattokinase and serrapeptase, then attacks exposed fungal colonies with caprylic acid, oregano oil, and pau d'arco. Strict sugar-free diet is non-negotiable. Phase 1 disrupts biofilm, Phase 2 kills candida, Phase 3 rebuilds gut flora.",
        "creator": "Functional Medicine",
        "evidence": "moderate",
        "days": 56,
        "score": 71,
        "items": [
          {
            "name": "Nattokinase",
            "item_type": "supplement",
            "meta": "06:30",
            "group_name": "Morning (Empty Stomach)",
            "description": "Take 30 min before breakfast on empty stomach. Candida builds biofilm — a polysaccharide matrix — that antifungals cannot penetrate. Nattokinase (from fermented soy) is a powerful fibrinolytic enzyme that dissolves this protective layer, exposing the candida beneath. This is why most candida protocols fail — they skip biofilm disruption."
          },
          {
            "name": "Serrapeptase",
            "item_type": "supplement",
            "meta": "06:30",
            "group_name": "Morning (Empty Stomach)",
            "description": "Take with nattokinase on empty stomach. Serrapeptase attacks the protein matrix of biofilm while nattokinase attacks the fibrin component. Together they create holes in the biofilm large enough for antifungals to reach candida colonies. Must be enteric-coated to survive stomach acid."
          },
          {
            "name": "NAC / N-Acetyl Cysteine",
            "item_type": "supplement",
            "meta": "06:30",
            "group_name": "Morning (Empty Stomach)",
            "description": "Take with the enzymes. NAC disrupts biofilm through a different mechanism — breaking disulfide bonds in the matrix. Also boosts glutathione production, which youll need to process the Herxheimer die-off toxins when candida starts dying."
          },
          {
            "name": "Caprylic Acid",
            "item_type": "supplement",
            "meta": "07:30",
            "group_name": "Morning (With Food)",
            "description": "Take with breakfast, 1 hour after biofilm disruptors. Caprylic acid (C8) penetrates candida cell walls and disrupts their lipid membrane, causing cell death. Its in coconut oil naturally, but supplemental form delivers a therapeutic dose. Start at 500mg and increase to prevent severe die-off."
          },
          {
            "name": "Oregano Oil",
            "item_type": "supplement",
            "meta": "07:30",
            "group_name": "Morning (With Food)",
            "description": "Take with breakfast in enteric-coated capsule. Carvacrol in oregano oil kills candida on contact by disrupting the cell membrane. Unlike pharmaceutical antifungals, candida cannot easily develop resistance to oregano oil because it attacks through multiple mechanisms simultaneously."
          },
          {
            "name": "Caprylic Acid",
            "item_type": "supplement",
            "meta": "13:00",
            "group_name": "Midday",
            "description": "Take with lunch. Multiple daily doses maintain steady antifungal pressure. Candida can regrow quickly in 6-8 hours — consistent dosing prevents recovery between doses."
          },
          {
            "name": "Pau D'arco",
            "item_type": "supplement",
            "meta": "13:00",
            "group_name": "Midday",
            "description": "Take with lunch. Pau d Arco (Taheebo) is a South American bark used for centuries against fungal infections. Lapachol and beta-lapachone interfere with candidas energy production. Provides a different kill mechanism than caprylic acid and oregano — important for preventing resistance."
          },
          {
            "name": "Probiotic",
            "item_type": "supplement",
            "meta": "19:00",
            "group_name": "Evening",
            "description": "Take with dinner, separated from antifungals by at least 1 hour. As candida colonies die, you want beneficial bacteria immediately colonizing that space. L. acidophilus produces lactic acid and hydrogen peroxide that create an inhospitable environment for candida regrowth."
          },
          {
            "name": "Saccharomyces Boulardii",
            "item_type": "supplement",
            "meta": "19:00",
            "group_name": "Evening",
            "description": "Take with dinner probiotics. S. boulardii is a non-pathogenic yeast that physically occupies the adhesion sites candida needs to colonize the gut wall. It also produces capric acid, which is antifungal. Unlike bacteria-based probiotics, it survives concurrent antifungal therapy."
          },
          {
            "name": "STRICT no sugar, no refined carbs, no alcohol, no fruit",
            "item_type": "consume",
            "group_name": "All Day",
            "description": "This is THE most important part. Candida feeds primarily on simple sugars. Removing all sugar, refined flour, alcohol, and initially fruit creates metabolic starvation. After 2 weeks add low-sugar fruits (berries). This dietary restriction is non-negotiable — it makes or breaks the protocol."
          },
          {
            "name": "Anti-candida foods: raw garlic, coconut oil, ginger, apple cider vinegar",
            "item_type": "consume",
            "group_name": "All Day",
            "description": "Build meals around known antifungal foods. 2-3 raw garlic cloves daily (crush and let sit 10 min to activate allicin). Cook with coconut oil (lauric and caprylic acid). ACV before meals (1 tbsp in water) creates acidic environment candida hates."
          },
          {
            "name": "Expect",
            "item_type": "activity",
            "group_name": "All Day",
            "description": "Days 3-10 you may feel worse: fatigue, brain fog, headache, skin breakouts, joint pain. This is candida releasing endotoxins as it dies. Support with: extra water, activated charcoal between meals, Epsom salt baths, rest. Reduce antifungal dose if unbearable, but dont stop."
          }
        ]
      }
    ]
  },
  {
    "key": "healthy-kids",
    "label": "Healthy kids",
    "pillar": "Health",
    "protocols": [
      {
        "key": "baby-nutrition-0-to-1-year",
        "name": "Baby Nutrition — 0 to 1 Year",
        "chip": "Ages 0–1",
        "description": "Breast milk or formula leads the whole first year, with iron-rich first foods introduced around 6 months. The focus is responsive, on-demand feeding, single-ingredient textures and steady weight gain — never honey before 12 months.",
        "creator": "AAP infant feeding",
        "source": "AAP infant feeding guidelines",
        "evidence": "high",
        "score": 92,
        "items": [
          {
            "name": "Breast Milk / Formula Feed",
            "item_type": "consume",
            "meta": "06:00",
            "group_name": "Morning Feed",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_breast_milk_formula_feed-1779273822782.png",
            "description": "0-6mo: exclusive breastmilk/formula, 6-12mo: + solids"
          },
          {
            "name": "Tummy Time",
            "item_type": "activity",
            "meta": "08:00",
            "group_name": "Development",
            "description": "Builds neck and core strength — start 3-5 min, increase"
          },
          {
            "name": "Mid-Morning Feed",
            "item_type": "consume",
            "meta": "09:30",
            "group_name": "Feed",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_feed_ningfeed-1779298198086.png",
            "description": "Breast/formula + pureed fruit (6mo+)"
          },
          {
            "name": "Lunch Solids",
            "item_type": "consume",
            "meta": "12:00",
            "group_name": "Meal",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_solids_6mo_olids6mo-1779297860620.png",
            "description": "Iron-fortified cereal, pureed vegetables, protein",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Afternoon Feed",
            "item_type": "consume",
            "meta": "15:00",
            "group_name": "Feed",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_feed-1779273143754.png",
            "description": "Breast/formula"
          },
          {
            "name": "Dinner Solids",
            "item_type": "consume",
            "meta": "17:30",
            "group_name": "Meal",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_solids_6mo-1779274750060.png",
            "description": "Soft finger foods, mashed vegetables, protein",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Vitamin D Drops",
            "item_type": "supplement",
            "meta": "18:00",
            "group_name": "Supplement",
            "description": "400 IU daily — recommended for all breastfed infants"
          },
          {
            "name": "Bedtime Feed",
            "item_type": "consume",
            "meta": "19:00",
            "group_name": "Night",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_feed_timefeed-1779273534311.png",
            "description": "Final breast/formula feed before sleep routine",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom",
              "Sleep"
            ]
          }
        ],
        "dos": [
          "Feed on demand and follow hunger cues",
          "Introduce one new single-ingredient food at a time",
          "Offer iron-rich first foods from ~6 months"
        ],
        "donts": [
          "No honey before 12 months",
          "No cow's milk as a main drink under 1",
          "No added salt or sugar"
        ]
      },
      {
        "key": "toddler-nutrition-1-to-2-years",
        "name": "Toddler Nutrition — 1 to 2 Years",
        "chip": "Ages 1–2",
        "description": "Transition from baby foods to family meals. Focus on balanced nutrition, self-feeding skills, and establishing healthy eating patterns during this critical growth phase.",
        "creator": "AAP toddler nutrition",
        "source": "AAP toddler nutrition guidelines",
        "evidence": "moderate",
        "score": 90,
        "items": [
          {
            "name": "Whole Milk",
            "item_type": "consume",
            "meta": "07:00",
            "group_name": "Meal",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_whole_milk-1779312602445.png",
            "description": "Scrambled egg, toast fingers, fruit — self-feeding practice",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Active Play",
            "item_type": "activity",
            "meta": "09:00",
            "group_name": "Movement",
            "description": "Crawling, walking practice, stacking blocks"
          },
          {
            "name": "Morning Snack",
            "item_type": "consume",
            "meta": "10:00",
            "group_name": "Snack",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/1770717024858-aciimk.jpg",
            "description": "Cheese cubes, sliced banana, crackers",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Lunch",
            "item_type": "consume",
            "meta": "12:00",
            "group_name": "Meal",
            "image_url": "https://ermbkttsyvpenjjxaxcf.supabase.co/storage/v1/object/public/assets/images/recipes/meal_denmark_main_sandwich_open_faced_cheese/0_3.jpg",
            "description": "Soft pasta, steamed vegetables, ground meat — iron rich",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Afternoon Snack",
            "item_type": "consume",
            "meta": "15:00",
            "group_name": "Snack",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_raw_fruits-1779311383059.png",
            "description": "Yogurt, diced fruit, oat biscuit",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Dinner",
            "item_type": "consume",
            "meta": "17:30",
            "group_name": "Dinner",
            "description": "Family meal portions — fish, rice, steamed veg"
          },
          {
            "name": "Vitamin D",
            "item_type": "supplement",
            "meta": "18:00",
            "group_name": "Supplement",
            "description": "400-600 IU daily — continue through toddler years"
          },
          {
            "name": "Bedtime Milk",
            "item_type": "consume",
            "meta": "19:00",
            "group_name": "Night",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/1773497996981-lf7tqy.jpg",
            "description": "Warm whole milk — transition to cup from bottle",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom",
              "Sleep"
            ]
          }
        ],
        "dos": [
          "Offer whole milk and a variety of textures",
          "Let them self-feed with fingers and a spoon",
          "Pair iron-rich foods with vitamin C"
        ],
        "donts": [
          "No choking hazards (whole grapes, nuts)",
          "Limit 100% juice to 4 oz/day",
          "No sugary or caffeinated drinks"
        ]
      },
      {
        "key": "child-nutrition-2-to-3-years",
        "name": "Child Nutrition — 2 to 3 Years",
        "chip": "Ages 2–3",
        "description": "Supporting independent eating, varied food exposure, and physical development. Focus on preventing picky eating and ensuring adequate calcium, iron, and fiber intake.",
        "creator": "AAP early childhood nutrition",
        "source": "AAP early childhood nutrition",
        "evidence": "moderate",
        "score": 88,
        "items": [
          {
            "name": "Breakfast",
            "item_type": "consume",
            "meta": "07:00",
            "group_name": "Meal",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/1773500331126-8fajw8.jpg",
            "description": "Oatmeal with berries, milk — fiber + calcium",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Outdoor Play",
            "item_type": "activity",
            "meta": "09:00",
            "group_name": "Movement",
            "description": "Running, climbing, sandbox — gross motor skills"
          },
          {
            "name": "Morning Snack",
            "item_type": "consume",
            "meta": "10:00",
            "group_name": "Snack",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/1770717024858-aciimk.jpg",
            "description": "Apple slices with almond butter, water",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Lunch",
            "item_type": "consume",
            "meta": "12:00",
            "group_name": "Meal",
            "image_url": "https://ermbkttsyvpenjjxaxcf.supabase.co/storage/v1/object/public/assets/images/recipes/meal_denmark_main_sandwich_open_faced_cheese/0_3.jpg",
            "description": "Whole grain wrap, hummus, cucumber, chicken strips",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Afternoon Snack",
            "item_type": "consume",
            "meta": "15:00",
            "group_name": "Snack",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_raw_fruits-1779311383059.png",
            "description": "Yogurt smoothie with spinach hidden inside",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Creative Play",
            "item_type": "activity",
            "meta": "16:00",
            "group_name": "Development",
            "description": "Drawing, puzzles, sensory play — fine motor skills"
          },
          {
            "name": "Dinner",
            "item_type": "consume",
            "meta": "17:30",
            "group_name": "Dinner",
            "description": "Family dinner — encourage trying new foods, no pressure"
          },
          {
            "name": "Multivitamin Gummy",
            "item_type": "supplement",
            "meta": "18:00",
            "group_name": "Supplement",
            "description": "Age-appropriate multivitamin if picky eater"
          }
        ],
        "dos": [
          "Aim for 75% plants on the plate",
          "Eat together and model good habits",
          "Re-offer new foods 8–10 times"
        ],
        "donts": [
          "No added sugar",
          "No fried or fast food",
          "Don't force a clean plate"
        ]
      },
      {
        "key": "child-nutrition-3-to-4-years",
        "name": "Child Nutrition — 3 to 4 Years",
        "chip": "Ages 3–4",
        "description": "Building food independence and routine. Structured meals and snacks rich in fiber, calcium and omega-3s support fast brain growth and steady energy through busy preschool days.",
        "creator": "AAP early childhood nutrition",
        "source": "AAP early childhood nutrition",
        "evidence": "moderate",
        "score": 88,
        "items": [
          {
            "name": "Breakfast",
            "item_type": "consume",
            "meta": "07:00",
            "group_name": "Meal",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/1773500331126-8fajw8.jpg",
            "description": "Whole grain pancakes, eggs, fruit — brain fuel",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Structured Physical Play",
            "item_type": "activity",
            "meta": "09:00",
            "group_name": "Movement",
            "description": "Bike riding, dancing, swimming lessons"
          },
          {
            "name": "Morning Snack",
            "item_type": "consume",
            "meta": "10:00",
            "group_name": "Snack",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/1770717024858-aciimk.jpg",
            "description": "Cheese, whole grain crackers, grapes",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Lunch",
            "item_type": "consume",
            "meta": "12:00",
            "group_name": "Meal",
            "image_url": "https://ermbkttsyvpenjjxaxcf.supabase.co/storage/v1/object/public/assets/images/recipes/meal_denmark_main_sandwich_open_faced_cheese/0_3.jpg",
            "description": "Fish fingers, mashed potato, peas — omega-3 focus",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Afternoon Snack",
            "item_type": "consume",
            "meta": "15:00",
            "group_name": "Snack",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_raw_fruits-1779311383059.png",
            "description": "Veggie sticks with ranch, milk",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Learning Activity",
            "item_type": "activity",
            "meta": "16:00",
            "group_name": "Development",
            "description": "Puzzles, building, pretend play — cognitive growth"
          },
          {
            "name": "Dinner",
            "item_type": "consume",
            "meta": "17:30",
            "group_name": "Dinner",
            "description": "Spaghetti bolognese, side salad — involve child in prep"
          },
          {
            "name": "Omega-3",
            "item_type": "supplement",
            "meta": "18:00",
            "group_name": "Supplement",
            "description": "DHA 200mg, Vit D 600 IU"
          }
        ],
        "dos": [
          "Keep regular meal and snack times",
          "Involve them in simple food prep",
          "Make water the default drink"
        ],
        "donts": [
          "No screens at the table",
          "Keep sweets occasional, not daily",
          "No all-day grazing"
        ]
      },
      {
        "key": "child-nutrition-4-to-5-years",
        "name": "Child Nutrition — 4 to 5 Years",
        "chip": "Ages 4–5",
        "description": "Preparing for school with balanced, portable meals. Focus on protein and fiber for fullness, calcium and vitamin D for growing bones, and a healthy relationship with food and movement.",
        "creator": "AAP early childhood nutrition",
        "source": "AAP early childhood nutrition",
        "evidence": "moderate",
        "score": 87,
        "items": [
          {
            "name": "Breakfast",
            "item_type": "consume",
            "meta": "07:00",
            "group_name": "Meal",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/1773500331126-8fajw8.jpg",
            "description": "Porridge with seeds, boiled egg, milk — sustained energy",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Active Play or Sport",
            "item_type": "activity",
            "meta": "09:00",
            "group_name": "Movement",
            "description": "Team games, gymnastics, swimming — coordination"
          },
          {
            "name": "Morning Snack",
            "item_type": "consume",
            "meta": "10:00",
            "group_name": "Snack",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/1770717024858-aciimk.jpg",
            "description": "Fruit salad, cheese stick",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Lunch",
            "item_type": "consume",
            "meta": "12:00",
            "group_name": "Meal",
            "image_url": "https://ermbkttsyvpenjjxaxcf.supabase.co/storage/v1/object/public/assets/images/recipes/meal_denmark_main_sandwich_open_faced_cheese/0_3.jpg",
            "description": "Sandwich, soup, fruit — practice packed lunch for school",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Afternoon Snack",
            "item_type": "consume",
            "meta": "15:00",
            "group_name": "Snack",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_raw_fruits-1779311383059.png",
            "description": "Rice cakes, hummus, cucumber",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Quiet Focused Activity",
            "item_type": "activity",
            "meta": "16:00",
            "group_name": "Development",
            "description": "Reading, colouring, letter practice — school prep"
          },
          {
            "name": "Dinner",
            "item_type": "consume",
            "meta": "17:30",
            "group_name": "Dinner",
            "description": "Grilled chicken, rice, broccoli — child helps serve"
          },
          {
            "name": "Probiotic",
            "item_type": "supplement",
            "meta": "18:00",
            "group_name": "Supplement",
            "description": "Immune support for nursery/school transition"
          }
        ],
        "dos": [
          "Balance every plate: protein + produce + grain",
          "Let them help pack their lunch",
          "Encourage 60 min of active play"
        ],
        "donts": [
          "No sugary cereals or sodas",
          "Don't use food as a reward or punishment",
          "Limit ultra-processed snacks"
        ]
      }
    ]
  },
  {
    "key": "longevity",
    "label": "Longevity",
    "pillar": "Health",
    "protocols": [
      {
        "key": "self-heal-by-design",
        "name": "Self Heal by Design",
        "chip": "Self Heal by Design",
        "description": "Barbara O'Neill's flagship full-day protocol from her 2014 book \"Self Heal by Design\" — the complete natural-healing routine that built her reputation across Australia and the United States.\n\n### The daily rhythm\nMorning sun for circadian entrainment, 16:8 intermittent fasting, raw fruits and vegetables as the foundation of every meal, deep hydration with mineralised water, daily movement and barefoot grounding, and consistent sleep hygiene.\n\n### The 8 Laws of Health\n**Nutrition · exercise · water · sunlight · temperance · air · rest · trust.** This is the umbrella protocol every other Barbara routine sits inside.\n\n### Why it matters\nA single integrated daily rhythm is more sustainable than chasing individual interventions — Barbara's tens of thousands of retreat alumni use this as their lifelong template.\n\nSource: Self Heal by Design (book). Educational lifestyle content reflecting Barbara O'Neill's published teachings — not medical advice.",
        "creator": "Barbara O'Neill",
        "source": "Barbara O'Neill — Self Heal by Design",
        "evidence": "moderate",
        "score": 88,
        "items": [
          {
            "name": "Gratitude on Waking",
            "item_type": "activity",
            "meta": "05:30",
            "group_name": "Plan",
            "children": [
              "Name three things you're grateful for before getting out of bed.",
              "The first thoughts of the day set the body's biochemistry for hours afterwards."
            ]
          },
          {
            "name": "Tongue Scraping",
            "item_type": "activity",
            "meta": "05:35",
            "group_name": "Clean",
            "children": [
              "Copper or stainless scraper, back to front, 5–10 strokes. Rinse between passes.",
              "Removes the overnight bacterial coating before you drink water — don't re-swallow it."
            ]
          },
          {
            "name": "Warm Lemon Water",
            "item_type": "consume",
            "meta": "05:40",
            "group_name": "Consume",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_warm_lemon_water-1779312331717.png",
            "children": [
              "Sip slowly, don't gulp",
              "Room temperature, not iced"
            ]
          },
          {
            "name": "Apple Cider Vinegar Tonic",
            "item_type": "supplement",
            "meta": "05:50",
            "group_name": "Supplement",
            "image_url": "https://www.trelune.com.au/cdn/shop/files/tre-lune-digest-tincture-barbara-oneill-australia-_Front.jpg?width=1024",
            "children": [
              "1 tbsp raw ACV (with the mother) in warm water, 20 min before meals.",
              "Primes stomach acid — low HCl is the hidden cause of most \"indigestion\" and reflux."
            ]
          },
          {
            "name": "Oil Pulling",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Clean",
            "children": [
              "Swish 1 tbsp cold-pressed coconut oil — pulls bacteria + biofilm from teeth & gums.",
              "Spit out (don't swallow) — the oil now carries pathogens you don't want re-absorbed.",
              "Rinse with warm salt water + brush after. Best done before food or coffee."
            ]
          },
          {
            "name": "Dry Skin Brushing",
            "item_type": "activity",
            "meta": "06:15",
            "group_name": "Wellness",
            "children": [
              "Use a natural bristle brush, always upward toward the heart — that's the direction of lymph flow.",
              "Pumps the lymphatic system, which has no heart-pump of its own. Skin is the third kidney.",
              "Do it dry, before showering, 3–5 minutes a day."
            ]
          },
          {
            "name": "Hot/Cold Contrast Shower",
            "item_type": "activity",
            "meta": "06:20",
            "group_name": "Wellness",
            "children": [
              "30 sec hot · 30 sec cold · repeat 3–5 cycles. Always finish on cold.",
              "Trains vascular tone, pumps lymph, raises norepinephrine for alertness.",
              "Cold finish activates brown fat and seals the skin closed against the day."
            ]
          },
          {
            "name": "Barefoot Grounding",
            "item_type": "activity",
            "meta": "06:30",
            "group_name": "Wellness"
          },
          {
            "name": "Morning Sunlight",
            "item_type": "activity",
            "meta": "06:35",
            "group_name": "Wellness",
            "children": [
              "No Sunglasses",
              "Skin Exposed"
            ]
          },
          {
            "name": "4-7-8 Breathing",
            "item_type": "activity",
            "meta": "06:55",
            "group_name": "Wellness",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_478_breathing.png",
            "children": [
              "Nasal breathing only",
              "Prefer outdoor / open window"
            ]
          },
          {
            "name": "Rebounding",
            "item_type": "activity",
            "meta": "07:00",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_rebounding.png",
            "children": [
              "Bounce gently 5–15 min. Even feet-on-mat counts. Most efficient lymphatic pump there is.",
              "Up-down gravity opens and closes the one-way lymph valves — nothing else moves lymph faster."
            ]
          },
          {
            "name": "Spinal Mobility",
            "item_type": "activity",
            "meta": "07:15",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_spinal_mobility.png"
          },
          {
            "name": "Beetroot",
            "item_type": "consume",
            "meta": "07:30",
            "group_name": "Consume",
            "image_url": "https://ermbkttsyvpenjjxaxcf.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/1773496422837-5a2ifn.jpg",
            "description": "Beet + Carrot + Greens Juice",
            "children": [
              "Raw or lightly steamed — betaine & betalains stimulate bile flow and thin sluggish bile."
            ]
          },
          {
            "name": "Freshly Ground Flaxseed",
            "item_type": "supplement",
            "meta": "07:45",
            "group_name": "Supplement"
          },
          {
            "name": "Soaked Oats with Berries, Flax & Raw Honey",
            "item_type": "consume",
            "meta": "08:00",
            "group_name": "Consume",
            "description": "Breakfast like a king.",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Brisk Walk After Breakfast",
            "item_type": "activity",
            "meta": "08:35",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_breakfast.png"
          },
          {
            "name": "Meditation",
            "item_type": "activity",
            "meta": "09:00",
            "group_name": "Plan"
          },
          {
            "name": "Big Rainbow Salad with Sprouts",
            "item_type": "consume",
            "meta": "12:30",
            "group_name": "Consume",
            "description": "Lunch like a prince.",
            "children": [
              "75% raw plant foods",
              "Chew Each Bite",
              "No water with meal",
              "Include bitter greens",
              "Include cruciferous veg"
            ]
          },
          {
            "name": "Brisk Walk After Lunch",
            "item_type": "activity",
            "meta": "13:15",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_lunch.png"
          },
          {
            "name": "Midday Sun for Vitamin D",
            "item_type": "activity",
            "meta": "14:00",
            "group_name": "Wellness",
            "children": [
              "Skin Exposed",
              "No sunscreen mid-day"
            ]
          },
          {
            "name": "Daily Nature Time",
            "item_type": "activity",
            "meta": "15:00",
            "group_name": "Plan"
          },
          {
            "name": "Infrared / Steam Sauna",
            "item_type": "activity",
            "meta": "16:00",
            "group_name": "Wellness",
            "description": "3-5x/week."
          },
          {
            "name": "Daily Outdoor Walk",
            "item_type": "activity",
            "meta": "17:00",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_daily_outdoor_walk.png",
            "children": [
              "30–60 min outdoors, ideally morning or late afternoon light.",
              "Walking pumps lymph, oxygenates blood, anchors hormones to the day-night cycle."
            ]
          },
          {
            "name": "Steamed Greens + Lentil Stew & Sauerkraut",
            "item_type": "consume",
            "meta": "18:00",
            "group_name": "Consume",
            "description": "Dinner like a pauper.",
            "children": [
              "Stop eating by 6pm",
              "Chew Each Bite",
              "No water with meal"
            ]
          },
          {
            "name": "Ginger Tea",
            "item_type": "consume",
            "meta": "18:30",
            "group_name": "Consume"
          },
          {
            "name": "Post-Dinner Walk",
            "item_type": "activity",
            "meta": "18:45",
            "group_name": "Exercise",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_oneill_walk_after_dinner.png"
          },
          {
            "name": "Castor Oil Pack on Liver",
            "item_type": "activity",
            "meta": "19:30",
            "group_name": "Wellness",
            "description": "3-5 nights per week.",
            "children": [
              "Wool flannel + cold-pressed castor oil + hot water bottle, 30–60 min on right side.",
              "Increases lymphocyte production, softens scar tissue, deeply relaxing for vagus nerve."
            ]
          },
          {
            "name": "Epsom Salt Bath",
            "item_type": "activity",
            "meta": "20:00",
            "group_name": "Wellness",
            "children": [
              "1–2 cups Epsom (magnesium sulfate) in a hot bath, 20 min. Skin absorbs the magnesium.",
              "Relaxes muscles, draws toxins through sweat, dramatically improves sleep onset."
            ]
          },
          {
            "name": "Magnesium Oil Spray",
            "item_type": "supplement",
            "meta": "20:30",
            "group_name": "Supplement",
            "image_url": "https://www.trelune.com.au/cdn/shop/files/earthbless-remineralize-magnesium-oil.jpg?width=1024",
            "children": [
              "5–10 sprays magnesium chloride on inner forearms or calves before bed.",
              "Transdermal bypasses poor gut absorption — relaxes muscles + nervous system for sleep."
            ]
          },
          {
            "name": "Turmeric Golden Milk",
            "item_type": "consume",
            "meta": "20:45",
            "group_name": "Consume"
          },
          {
            "name": "Chamomile / Passionflower Tea",
            "item_type": "consume",
            "meta": "21:15",
            "group_name": "Consume"
          },
          {
            "name": "Evening Tooth Brushing",
            "item_type": "activity",
            "meta": "21:45",
            "group_name": "Clean"
          },
          {
            "name": "Gratitude Journal",
            "item_type": "activity",
            "meta": "21:50",
            "group_name": "Plan",
            "children": [
              "Write 3 specific gratitudes + name 1 person to forgive each evening.",
              "Unforgiveness raises cortisol and suppresses immunity. Gratitude does the opposite."
            ]
          },
          {
            "name": "Sleep in Complete Darkness",
            "item_type": "activity",
            "meta": "22:00",
            "group_name": "Wellness",
            "description": "Bed by 10pm.",
            "children": [
              "Sleep on left side",
              "Cool Bedroom",
              "Window cracked for fresh air",
              "Cover all LED lights",
              "In bed by 10pm",
              "No phones/WiFi in bedroom",
              "No screens 1-2h before bed",
              "Wear Natural Fibres",
              "Bedroom aired during the day"
            ]
          }
        ]
      },
      {
        "key": "dr-rhonda-patrick-micronutrient-protocol",
        "name": "Dr. Rhonda Patrick Micronutrient Protocol",
        "chip": "Rhonda Patrick",
        "description": "FoundMyFitness scientist's evidence-backed longevity stack. Daily sauna 20 min at 80°C (4x/week), cold plunge immediately after, omega-3 4g EPA+DHA, vitamin D3 5000 IU + K2, magnesium glycinate 400mg, sulforaphane from broccoli sprouts, and quarterly comprehensive blood panels. Exercise 5x/week, prioritise sleep 7-9 hrs.",
        "creator": "Rhonda Patrick",
        "evidence": "high",
        "score": 93,
        "items": [
          {
            "name": "Omega-3 Fish Oil",
            "item_type": "supplement",
            "meta": "07:00",
            "group_name": "Morning Supplement Stack",
            "image_url": "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Omega_3_supplement_bottle_1.webp",
            "description": "2.5g EPA+DHA, with food"
          },
          {
            "name": "Vitamin D3",
            "item_type": "supplement",
            "meta": "07:02",
            "group_name": "Morning Supplement Stack",
            "description": "5000 IU"
          },
          {
            "name": "Magnesium Bisglycinate",
            "item_type": "supplement",
            "meta": "07:03",
            "group_name": "Morning Supplement Stack",
            "description": "400mg"
          },
          {
            "name": "Sulforaphane via Broccoli Sprouts",
            "item_type": "consume",
            "meta": "07:10",
            "group_name": "Morning Supplement Stack",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_sulforaphane_via_broccoli_sprouts-1779311985900.png",
            "description": "2 cups"
          },
          {
            "name": "Vitamin C",
            "item_type": "supplement",
            "meta": "07:15",
            "group_name": "Morning Supplement Stack",
            "description": "1g"
          },
          {
            "name": "B-Complex",
            "item_type": "supplement",
            "meta": "07:16",
            "group_name": "Morning Supplement Stack",
            "description": "Methylated B12 + Folate"
          },
          {
            "name": "Sauna Session",
            "item_type": "activity",
            "meta": "10:00",
            "group_name": "Sauna & Cold Protocol",
            "description": "176°F | 20 min at 80°C (176°F)"
          },
          {
            "name": "Cold Plunge Immersion",
            "item_type": "activity",
            "meta": "10:25",
            "group_name": "Sauna & Cold Protocol",
            "description": "14°C | 3–5 min (14°C)"
          },
          {
            "name": "Rehydration",
            "item_type": "consume",
            "meta": "10:30",
            "group_name": "Sauna & Cold Protocol",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_rehydration_electrolyte_water_magnesium-1779311523007.png",
            "description": "Drink slowly; room temperature water absorbs faster than cold"
          },
          {
            "name": "Zone 2 Cardio",
            "item_type": "activity",
            "meta": "11:00",
            "group_name": "Sauna & Cold Protocol",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_root_zone2.png",
            "description": "30–40 min, 60–70% HRmax"
          },
          {
            "name": "Micronutrient Blood Panel Review",
            "item_type": "activity",
            "meta": "18:00",
            "group_name": "Evening Lab Optimization",
            "description": "weekly/monthly"
          },
          {
            "name": "Melatonin",
            "item_type": "supplement",
            "meta": "21:00",
            "group_name": "Evening Lab Optimization",
            "description": "0.3mg micro-dose, NOT 10mg",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom"
            ]
          },
          {
            "name": "Selenium",
            "item_type": "supplement",
            "meta": "21:02",
            "group_name": "Evening Lab Optimization",
            "description": "200mcg"
          },
          {
            "name": "Polyphenol-Rich Dinner",
            "item_type": "consume",
            "meta": "19:00",
            "group_name": "Evening Lab Optimization",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_polyphenol_rich_dinner-1779298591808.png",
            "description": "blueberries, turmeric, EVOO",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Sleep",
            "item_type": "activity",
            "meta": "21:30",
            "group_name": "Evening Lab Optimization",
            "description": "Keep the room cool and dark; maintain consistent timing even on weekends",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom",
              "Sleep"
            ]
          }
        ]
      },
      {
        "key": "longevity-inspired-by-bryan-johnson",
        "name": "Longevity — Inspired by Bryan Johnson",
        "chip": "Bryan Johnson",
        "description": "A structured morning routine built around well-known healthspan habits: early light exposure, a polyphenol-rich pre-workout drink, a consistent daily supplement stack, exercise on a rotating 7-day plan, and a nutrient-dense breakfast.\n\nThe goal is a repeatable, evidence-informed morning rhythm — circadian light, movement, and whole-food nutrition — that supports general energy and wellbeing.\n\nThis routine reflects healthspan principles popularised by Bryan Johnson's Blueprint project. So Health is not affiliated with, endorsed by, or sponsored by Bryan Johnson or Blueprint. Educational lifestyle content — not medical advice.",
        "creator": "Bryan Johnson",
        "source": "Longevity Morning Protocol — reflecting healthspan principles popularised by Bryan Johnson's Blueprint project. Not affiliated with, endorsed by, or sponsored by Bryan Johnson or Blueprint. Educational content, not medical advice.",
        "evidence": "moderate",
        "days": 7,
        "score": 97,
        "items": [
          {
            "name": "Evening Sleep Start",
            "item_type": "activity",
            "meta": "20:30",
            "group_name": "Sleep",
            "description": "Begin wind-down routine for optimal sleep",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom",
              "Sleep"
            ]
          },
          {
            "name": "Wake Up",
            "item_type": "activity",
            "meta": "05:00",
            "group_name": "Recovery",
            "description": "Consistent wake time for circadian rhythm",
            "children": [
              "Cool bedroom 17-19C",
              "Total darkness",
              "No phone in bedroom"
            ]
          },
          {
            "name": "Body Composition",
            "item_type": "activity",
            "meta": "05:00",
            "group_name": "health_measurement",
            "description": "Daily weight, body fat, and biomarker tracking"
          },
          {
            "name": "Morning Mindfulness",
            "item_type": "activity",
            "meta": "05:00",
            "group_name": "Mindfulness",
            "description": "Mental training and intention setting"
          },
          {
            "name": "Light Exposure",
            "item_type": "activity",
            "meta": "05:05",
            "group_name": "light_environment",
            "description": "10,000 lux bright light for circadian entrainment"
          },
          {
            "name": "Hair Care Routine",
            "item_type": "activity",
            "meta": "05:09",
            "group_name": "Haircare",
            "description": "Scalp treatment with red light therapy"
          },
          {
            "name": "Quick Shower",
            "item_type": "activity",
            "meta": "05:20",
            "group_name": "Hygiene",
            "description": "Morning hygiene routine"
          },
          {
            "name": "Pre-Workout Longevity Drink",
            "item_type": "consume",
            "meta": "05:25",
            "group_name": "Drink",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_longevity_drink-1779273640720.png",
            "description": "8 oz: 1 scoop Longevity Mix + 2.5g Creatine + 1/2 tsp Galactooligosaccharides + 1 tsp Inulin + 1 tsp Arabinogalactan powder"
          },
          {
            "name": "Pre-Workout Breakfast",
            "item_type": "consume",
            "meta": "05:35",
            "group_name": "Meal",
            "description": "1 scoop Longevity Protein + Blueberry Nut Mix (macadamia, walnuts, blueberries) + 11g Collagen Peptides + 1 Tbsp EVOO + Berries",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          },
          {
            "name": "Essential Capsules",
            "item_type": "supplement",
            "meta": "05:35",
            "group_name": "Supplement",
            "image_url": "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Essential_Capsules_Supplement_bottle.webp",
            "description": "2 capsules - Contains: Vit D 50mcg, NR 300mg, Broccoli Seed Extract 200mg, Fisetin 100mg, Luteolin 100mg, Ubiquinol 50mg, Probiotics 4B CFU, Spermidine 10mg, Boron 3mg, Lithium 1mg"
          },
          {
            "name": "Advanced Antioxidants",
            "item_type": "supplement",
            "meta": "05:35",
            "group_name": "Supplement",
            "image_url": "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Advanced_Antioxidants_Supplement_Bottle_Delayed_Release_Capsules.webp",
            "description": "1 capsule"
          },
          {
            "name": "Ashwagandha",
            "item_type": "supplement",
            "meta": "05:35",
            "group_name": "Supplement",
            "image_url": "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Ashwagandha_Rhodiola_supplement_bottle.webp",
            "description": "1 capsule"
          },
          {
            "name": "Omega-3",
            "item_type": "supplement",
            "meta": "05:35",
            "group_name": "Supplement",
            "image_url": "https://blueprint.bryanjohnson.com/cdn/shop/files/Blueprint_Omega_3_supplement_bottle_1.webp",
            "description": "2 capsules"
          },
          {
            "name": "Proferrin",
            "item_type": "supplement",
            "meta": "05:35",
            "group_name": "Supplement",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_proferrin-1779311175626.png",
            "description": "10.5 mg iron supplement"
          },
          {
            "name": "Nr or Nmn",
            "item_type": "supplement",
            "meta": "05:35",
            "group_name": "Supplement",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_nr_nmn-1779298367039.png",
            "description": "NR 450mg OR NMN 500mg (NAD+ precursor)"
          },
          {
            "name": "Strength",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Strength",
            "description": "Warmup 10min → Squat 3x10-15 → Push-up 3x8-12 → Dumbbell Row 3x10-12 → Kettlebell Swing 3x30s → Farmers Walk 3x30s → Plank 3x20-30s → Stability 5-10min → Cardio 25min",
            "children": [
              "Warm up 10 min",
              "Progressive overload",
              "Stretching"
            ]
          },
          {
            "name": "General Warm-Up",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Warmup",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_general_warmup.png",
            "description": "Light movement to prepare body"
          },
          {
            "name": "Dynamic Warm-Up",
            "item_type": "activity",
            "meta": "06:05",
            "group_name": "Warmup",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_dynamic_stretch.png",
            "description": "Dynamic stretching and mobility"
          },
          {
            "name": "Squat",
            "item_type": "activity",
            "meta": "06:10",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_squat.png",
            "description": "3 sets x 10-15 reps"
          },
          {
            "name": "Push Up",
            "item_type": "activity",
            "meta": "06:20",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_push_up.png",
            "description": "3 sets x 8-12 reps, bodyweight"
          },
          {
            "name": "Dumbbell Row",
            "item_type": "activity",
            "meta": "06:28",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_dumbbell_row.png",
            "description": "3 sets x 10-12 reps each arm"
          },
          {
            "name": "Kettlebell Swing",
            "item_type": "activity",
            "meta": "06:38",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_kettlebell_swing.png",
            "description": "3 sets x 30 seconds"
          },
          {
            "name": "Farmers Walk",
            "item_type": "activity",
            "meta": "06:42",
            "group_name": "carry_work",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_farmers_walk.png",
            "description": "3 sets x 30 seconds"
          },
          {
            "name": "Plank",
            "item_type": "activity",
            "meta": "06:46",
            "group_name": "core_work",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_plank.png",
            "description": "3 sets x 20-30 seconds"
          },
          {
            "name": "Stability Training",
            "item_type": "activity",
            "meta": "06:50",
            "group_name": "stability_work",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_stability_training.png",
            "description": "Balance and stability work 5-10min",
            "children": [
              "Warm up 10 min",
              "Progressive overload",
              "Stretching"
            ]
          },
          {
            "name": "Moderate Cardio",
            "item_type": "activity",
            "meta": "07:00",
            "group_name": "Cardio",
            "description": "Brisk walk, slow jog, cycling, swimming, or elliptical"
          },
          {
            "name": "HIIT",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_day2_hiit_cardio.png",
            "description": "Tabata-style HIIT: 8 rounds of 20s all-out / 20s rest"
          },
          {
            "name": "All-Out Intervals",
            "item_type": "activity",
            "meta": "06:10",
            "group_name": "HIIT",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_hiit_allout.png",
            "description": "8 rounds: 20s max effort, 20s rest. Options: sprinting, cycling, rowing, burpees"
          },
          {
            "name": "Strength",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Strength",
            "description": "Mobility 10min → Strength 30min → Yoga 15min → Static Stretch 5min",
            "children": [
              "Warm up 10 min",
              "Progressive overload",
              "Stretching"
            ]
          },
          {
            "name": "Dynamic Stretching",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "mobility",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_dynamic_stretch.png",
            "description": "Full body dynamic mobility flow"
          },
          {
            "name": "Strength Training",
            "item_type": "activity",
            "meta": "06:10",
            "group_name": "strength_work",
            "description": "Moderate intensity strength circuit",
            "children": [
              "Warm up 10 min",
              "Progressive overload",
              "Stretching"
            ]
          },
          {
            "name": "Beginner Yoga",
            "item_type": "activity",
            "meta": "06:40",
            "group_name": "Movement",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_yoga_beginner.png",
            "description": "Cat-cow, Cobblers pose, Tree pose, Cobra pose"
          },
          {
            "name": "Static Stretching",
            "item_type": "activity",
            "meta": "06:55",
            "group_name": "Movement",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_static_stretch.png",
            "description": "Hold stretches for 30-60s each"
          },
          {
            "name": "Hiit",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_day2_hiit_cardio.png",
            "description": "High-intensity interval training"
          },
          {
            "name": "Hiit Intervals",
            "item_type": "activity",
            "meta": "06:10",
            "group_name": "HIIT",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_hiit_60_60.png",
            "description": "8-10 rounds: 60s work / 60s active recovery. Exercises: jumping jacks, high knees, burpees, sprints, mountain climbers"
          },
          {
            "name": "Strength Focus",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_day5_strength.png",
            "description": "Full strength training session",
            "children": [
              "Warm up 10 min",
              "Progressive overload",
              "Stretching"
            ]
          },
          {
            "name": "Lunges",
            "item_type": "activity",
            "meta": "06:10",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_lunge.png",
            "description": "3 sets x 10-12 reps each leg"
          },
          {
            "name": "Overhead Press",
            "item_type": "activity",
            "meta": "06:20",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_overhead_press.png",
            "description": "3 sets x 10-12 reps"
          },
          {
            "name": "Dumbbell Chest Press",
            "item_type": "activity",
            "meta": "06:30",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_chest_press.png",
            "description": "3 sets x 10-12 reps"
          },
          {
            "name": "Side Plank Hold",
            "item_type": "activity",
            "meta": "06:40",
            "group_name": "core_work",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_side_plank.png",
            "description": "20-30s each side"
          },
          {
            "name": "Step Up",
            "item_type": "activity",
            "meta": "06:44",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_step_up.png",
            "description": "3 sets x 10 reps each leg"
          },
          {
            "name": "Norwegian 4x4",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Strength",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_norwegian_4x4.png",
            "description": "Cardiac output training protocol"
          },
          {
            "name": "Norwegian 4x4",
            "item_type": "activity",
            "meta": "06:10",
            "group_name": "Cardio",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_norwegian_4x4.png",
            "description": "4 rounds: 4min at 85-95% max HR / 3min recovery at 60-70% max HR. Mode: treadmill or indoor bike"
          },
          {
            "name": "Active Recovery",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Strength",
            "description": "Rest and recovery day"
          },
          {
            "name": "Gentle Yoga/stretching",
            "item_type": "activity",
            "meta": "06:00",
            "group_name": "Recovery",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/activities/activity_gentle_yoga.png",
            "description": "20-30min gentle movement and stretching"
          },
          {
            "name": "Meditation",
            "item_type": "activity",
            "meta": "06:30",
            "group_name": "Mindfulness",
            "description": "15-20min extended meditation practice"
          },
          {
            "name": "Daily Sauna",
            "item_type": "activity",
            "meta": "07:30",
            "group_name": "Recovery",
            "description": "Heat therapy session"
          },
          {
            "name": "Full-Body Red Light",
            "item_type": "activity",
            "meta": "08:00",
            "group_name": "Recovery",
            "description": "Photobiomodulation therapy"
          },
          {
            "name": "Shockwave Therapy",
            "item_type": "activity",
            "meta": "08:15",
            "group_name": "Recovery",
            "description": "Acoustic wave therapy for joint health (optional)"
          },
          {
            "name": "Post-Workout Grooming",
            "item_type": "activity",
            "meta": "08:30",
            "group_name": "Hygiene",
            "description": "Shower and skincare routine",
            "children": [
              "Warm up 10 min",
              "Progressive overload",
              "Stretching"
            ]
          },
          {
            "name": "Oxygen Therapy Block",
            "item_type": "activity",
            "meta": "09:00",
            "group_name": "Recovery",
            "description": "Hyperoxic or EWOT session (optional)"
          },
          {
            "name": "Post-Workout Protein Meal",
            "item_type": "consume",
            "meta": "10:00",
            "group_name": "Meal",
            "image_url": "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/auto-generated/recipe_post_workout-1779273686301.png",
            "description": "Metabolic Protein + EVOO + Collagen + Berries. Ingredients: pea protein, hemp protein, pea starch, isomaltulose, resistant maltodextrin, MCT oil powder, flaxseed, sunflower lecithin, allulose, monk fruit, pink salt",
            "children": [
              "Chew slowly",
              "75% plants on plate"
            ]
          }
        ]
      }
    ]
  }
];
