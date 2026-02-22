-- Seed: catalog_equipment common cooking tools
-- Paste into: https://supabase.com/dashboard/project/mofhvoudjxinvpplsytd/sql

INSERT INTO catalog_equipment (name, category) VALUES
  ('Chef''s knife',        'Cutting'),
  ('Cutting board',        'Cutting'),
  ('Paring knife',         'Cutting'),
  ('Grater / Zester',      'Cutting'),
  ('Peeler',               'Cutting'),
  ('Large skillet',        'Cookware'),
  ('Wok',                  'Cookware'),
  ('Medium pot',           'Cookware'),
  ('Large pot',            'Cookware'),
  ('Saucepan',             'Cookware'),
  ('Sheet pan',            'Baking'),
  ('Baking dish',          'Baking'),
  ('Loaf pan',             'Baking'),
  ('Parchment paper',      'Baking'),
  ('Mixing bowl',          'Prep'),
  ('Colander / Strainer',  'Prep'),
  ('Garlic press',         'Prep'),
  ('Wooden spoon',         'Utensils'),
  ('Spatula',              'Utensils'),
  ('Whisk',                'Utensils'),
  ('Tongs',                'Utensils'),
  ('Ladle',                'Utensils'),
  ('Measuring spoons',     'Measuring'),
  ('Measuring cups',       'Measuring'),
  ('Kitchen scale',        'Measuring'),
  ('Blender',              'Appliances'),
  ('Immersion blender',    'Appliances'),
  ('Food processor',       'Appliances'),
  ('Oven',                 'Appliances')
ON CONFLICT DO NOTHING;
