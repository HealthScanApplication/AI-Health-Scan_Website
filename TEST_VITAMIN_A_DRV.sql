-- Test Vitamin A record with DRV data for admin panel visualization
-- Apply this to test the DRV widget in the admin panel

INSERT INTO catalog_elements (
  id,
  slug,
  name_common,
  type_label,
  category,
  health_role,
  description_simple,
  daily_recommended_adult,
  age_ranges,
  food_strategy
) VALUES (
  'vitamin_a_test',
  'vitamin-a-test',
  'Vitamin A',
  'vitamin',
  'nutrient',
  'beneficial',
  'Essential fat-soluble vitamin crucial for vision, immune function, reproduction, and cellular communication.',
  '{
    "male": {"value": 900, "unit": "μg RAE"},
    "female": {"value": 700, "unit": "μg RAE"}
  }'::jsonb,
  '{
    "europe": [
      {
        "age_group": "0-8y",
        "basis": "per_day",
        "male": {
          "deficiency": {"threshold": 280},
          "optimal": {
            "minimum": 300,
            "recommended": 400,
            "maximum": 600,
            "benefits": ["🟢 Vision", "🟢 Immunity", "🟢 Cell growth", "🟢 Bone formation"]
          },
          "excess": {
            "daily_limit": {"value": 600}
          }
        },
        "female": {
          "deficiency": {"threshold": 280},
          "optimal": {
            "minimum": 300,
            "recommended": 400,
            "maximum": 600,
            "benefits": ["🟢 Vision", "🟢 Immunity", "🟢 Cell growth", "🟢 Bone formation"]
          },
          "excess": {
            "daily_limit": {"value": 600}
          }
        }
      },
      {
        "age_group": "9-18y",
        "basis": "per_day",
        "male": {
          "deficiency": {"threshold": 420},
          "optimal": {
            "minimum": 500,
            "recommended": 750,
            "maximum": 2800,
            "benefits": ["🟢 Vision", "🟢 Immune support", "🟢 Skin health", "🟢 Gene expression"]
          },
          "excess": {
            "daily_limit": {"value": 2800}
          }
        },
        "female": {
          "deficiency": {"threshold": 420},
          "optimal": {
            "minimum": 500,
            "recommended": 650,
            "maximum": 2800,
            "benefits": ["🟢 Vision", "🟢 Immune support", "🟢 Skin health", "🟢 Gene expression"]
          },
          "excess": {
            "daily_limit": {"value": 2800}
          }
        }
      },
      {
        "age_group": "19-30y",
        "basis": "per_day",
        "male": {
          "deficiency": {"threshold": 630},
          "optimal": {
            "minimum": 750,
            "recommended": 900,
            "maximum": 3000,
            "benefits": ["🟢 Vision", "🟢 Immune support", "🟢 Skin integrity", "🟢 Antioxidant"]
          },
          "excess": {
            "daily_limit": {"value": 3000}
          }
        },
        "female": {
          "deficiency": {"threshold": 490},
          "optimal": {
            "minimum": 600,
            "recommended": 700,
            "maximum": 3000,
            "benefits": ["🟢 Vision", "🟢 Immune support", "🟢 Skin integrity", "🟢 Antioxidant"]
          },
          "excess": {
            "daily_limit": {"value": 3000}
          },
          "pregnancy": {
            "optimal": {
              "minimum": 550,
              "recommended": 770,
              "maximum": 3000,
              "benefits": ["🟢 Fetal development", "🟢 Placental function", "🟢 Vision development"]
            },
            "excess": {
              "daily_limit": {"value": 3000}
            }
          },
          "breastfeeding": {
            "optimal": {
              "minimum": 900,
              "recommended": 1300,
              "maximum": 3000,
              "benefits": ["🟢 Milk vitamin A", "🟢 Infant vision", "🟢 Immune transfer"]
            },
            "excess": {
              "daily_limit": {"value": 3000}
            }
          }
        }
      },
      {
        "age_group": "31-50y",
        "basis": "per_day",
        "male": {
          "deficiency": {"threshold": 630},
          "optimal": {
            "minimum": 750,
            "recommended": 900,
            "maximum": 3000,
            "benefits": ["🟢 Vision", "🟢 Immunity", "🟢 Tissue repair", "🟢 Antioxidant"]
          },
          "excess": {
            "daily_limit": {"value": 3000}
          }
        },
        "female": {
          "deficiency": {"threshold": 490},
          "optimal": {
            "minimum": 600,
            "recommended": 700,
            "maximum": 3000,
            "benefits": ["🟢 Vision", "🟢 Immunity", "🟢 Tissue repair", "🟢 Antioxidant"]
          },
          "excess": {
            "daily_limit": {"value": 3000}
          },
          "pregnancy": {
            "optimal": {
              "minimum": 550,
              "recommended": 770,
              "maximum": 3000,
              "benefits": ["🟢 Fetal development", "🟢 Placental function", "🟢 Organ growth"]
            },
            "excess": {
              "daily_limit": {"value": 3000}
            }
          },
          "breastfeeding": {
            "optimal": {
              "minimum": 900,
              "recommended": 1300,
              "maximum": 3000,
              "benefits": ["🟢 Milk quality", "🟢 Infant immunity", "🟢 Growth support"]
            },
            "excess": {
              "daily_limit": {"value": 3000}
            }
          }
        }
      },
      {
        "age_group": "51+y",
        "basis": "per_day",
        "male": {
          "deficiency": {"threshold": 630},
          "optimal": {
            "minimum": 750,
            "recommended": 900,
            "maximum": 3000,
            "benefits": ["🟢 Vision", "🟢 Immunity", "🟢 Epithelial health", "🟢 Antioxidant"]
          },
          "excess": {
            "daily_limit": {"value": 3000}
          }
        },
        "female": {
          "deficiency": {"threshold": 490},
          "optimal": {
            "minimum": 600,
            "recommended": 700,
            "maximum": 3000,
            "benefits": ["🟢 Vision", "🟢 Immunity", "🟢 Epithelial health", "🟢 Antioxidant"]
          },
          "excess": {
            "daily_limit": {"value": 3000}
          }
        }
      }
    ],
    "north_america": [
      {
        "age_group": "0-8y",
        "basis": "per_day",
        "male": {
          "deficiency": {"threshold": 280},
          "optimal": {
            "minimum": 300,
            "recommended": 400,
            "maximum": 600,
            "benefits": ["🟢 Vision", "🟢 Immunity", "🟢 Cell growth", "🟢 Bone formation"]
          },
          "excess": {
            "daily_limit": {"value": 600}
          }
        },
        "female": {
          "deficiency": {"threshold": 280},
          "optimal": {
            "minimum": 300,
            "recommended": 400,
            "maximum": 600,
            "benefits": ["🟢 Vision", "🟢 Immunity", "🟢 Cell growth", "🟢 Bone formation"]
          },
          "excess": {
            "daily_limit": {"value": 600}
          }
        }
      },
      {
        "age_group": "19-30y",
        "basis": "per_day",
        "male": {
          "deficiency": {"threshold": 630},
          "optimal": {
            "minimum": 750,
            "recommended": 900,
            "maximum": 3000,
            "benefits": ["🟢 Vision", "🟢 Immune support", "🟢 Skin integrity", "🟢 Antioxidant"]
          },
          "excess": {
            "daily_limit": {"value": 3000}
          }
        },
        "female": {
          "deficiency": {"threshold": 490},
          "optimal": {
            "minimum": 600,
            "recommended": 700,
            "maximum": 3000,
            "benefits": ["🟢 Vision", "🟢 Immune support", "🟢 Skin integrity", "🟢 Antioxidant"]
          },
          "excess": {
            "daily_limit": {"value": 3000}
          },
          "pregnancy": {
            "optimal": {
              "minimum": 550,
              "recommended": 770,
              "maximum": 3000,
              "benefits": ["🟢 Fetal development", "🟢 Placental function", "🟢 Vision development"]
            },
            "excess": {
              "daily_limit": {"value": 3000}
            }
          },
          "breastfeeding": {
            "optimal": {
              "minimum": 900,
              "recommended": 1300,
              "maximum": 3000,
              "benefits": ["🟢 Milk vitamin A", "🟢 Infant vision", "🟢 Immune transfer"]
            },
            "excess": {
              "daily_limit": {"value": 3000}
            }
          }
        }
      }
    ]
  }'::jsonb,
  '{
    "animal": "Include liver, dairy, and fish for highly bioavailable preformed vitamin A.",
    "plant": "Choose orange, red, and dark green vegetables for provitamin A carotenoids.",
    "fortified": "Select fortified foods when natural sources are limited or inadequate.",
    "fermented": "Include fermented dairy products for enhanced nutrient absorption.",
    "other": "Consume with healthy fats to optimize absorption and conversion efficiency."
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name_common = EXCLUDED.name_common,
  type_label = EXCLUDED.type_label,
  category = EXCLUDED.category,
  health_role = EXCLUDED.health_role,
  description_simple = EXCLUDED.description_simple,
  daily_recommended_adult = EXCLUDED.daily_recommended_adult,
  age_ranges = EXCLUDED.age_ranges,
  food_strategy = EXCLUDED.food_strategy,
  updated_at = now();
