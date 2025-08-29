/**
 * Admin data population functions
 * Contains functions for populating different data types
 */

import * as kv from '../supabase/functions/server/kv_store.tsx';
import { 
  NUTRIENTS_DATA, 
  POLLUTANTS_DATA, 
  INGREDIENTS_DATA, 
  PRODUCTS_DATA 
} from './adminConstants.tsx';
import { generateReliableImageUrl } from './adminHelpers.tsx';

export async function populateNutrients(count: number, includeImages: boolean, includeMetadata: boolean): Promise<number> {
  const nutrients = [...NUTRIENTS_DATA];
  
  // Add more nutrients to reach target count if needed
  while (nutrients.length < count) {
    const baseNutrients = nutrients.slice(0, 10);
    const index = (nutrients.length - 30) % baseNutrients.length;
    const extraNutrient = baseNutrients[index];
    nutrients.push({
      ...extraNutrient,
      name: `${extraNutrient.name} (Extended ${nutrients.length - 30 + 1})`
    });
  }
  
  let imported = 0;
  for (let i = 0; i < Math.min(count, nutrients.length); i++) {
    const nutrient = nutrients[i];
    const nutrientId = `nutrient_${Date.now()}_${imported}`;
    
    const nutrientData = {
      id: nutrientId,
      name: nutrient.name,
      category: nutrient.category,
      unit: nutrient.unit,
      rdi: nutrient.rdi,
      type: nutrient.type,
      description: `${nutrient.name} is a ${nutrient.type.toLowerCase()} essential for human health. It plays crucial roles in various biological processes and has an RDI of ${nutrient.rdi}${nutrient.unit}.`,
      health_benefits: `Essential for proper body function, supports immune system, energy metabolism, and cellular processes.`,
      deficiency_symptoms: `Deficiency may lead to various health issues. Consult healthcare provider for specific information.`,
      food_sources: JSON.stringify(['Fruits', 'Vegetables', 'Whole grains', 'Lean proteins', 'Dairy products']),
      source: 'HealthScan Nutrient Database',
      api_source: 'Internal Comprehensive Database',
      imported_at: new Date().toISOString(),
      external_id: `hs_nutrient_${i + 1}`,
      image_url: includeImages ? generateReliableImageUrl('nutrient', nutrient.name) : null
    };
    
    await kv.set(nutrientId, nutrientData);
    imported++;
    
    if (imported % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return imported;
}

export async function populatePollutants(count: number, includeImages: boolean, includeMetadata: boolean): Promise<number> {
  const pollutants = [...POLLUTANTS_DATA];
  
  // Extend list if needed
  while (pollutants.length < count) {
    const basePollutants = pollutants.slice(0, 10);
    const index = (pollutants.length - 20) % basePollutants.length;
    const extraPollutant = basePollutants[index];
    pollutants.push({
      ...extraPollutant,
      name: `${extraPollutant.name} (Extended ${pollutants.length - 20 + 1})`
    });
  }
  
  let imported = 0;
  for (let i = 0; i < Math.min(count, pollutants.length); i++) {
    const pollutant = pollutants[i];
    const pollutantId = `pollutant_${Date.now()}_${imported}`;
    
    const pollutantData = {
      id: pollutantId,
      name: pollutant.name,
      scientific_name: pollutant.name.toUpperCase(),
      category: pollutant.category,
      risk_level: pollutant.risk,
      description: `${pollutant.name} is a ${pollutant.category.toLowerCase()} commonly found in ${pollutant.source}. It poses a ${pollutant.risk.toLowerCase()} risk to human health.`,
      health_effects: `Exposure may cause respiratory issues, cardiovascular problems, and other health concerns. Risk level: ${pollutant.risk}.`,
      exposure_routes: `Inhalation, ingestion, dermal contact from ${pollutant.source}`,
      safe_levels: 'Refer to EPA and WHO guidelines for safe exposure limits',
      source: 'HealthScan Pollutant Database',
      api_source: 'Internal Environmental Database',
      imported_at: new Date().toISOString(),
      external_id: `hs_pollutant_${i + 1}`,
      image_url: includeImages ? generateReliableImageUrl('pollutant', pollutant.name) : null
    };
    
    await kv.set(pollutantId, pollutantData);
    imported++;
    
    if (imported % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return imported;
}

export async function populateIngredients(count: number, includeImages: boolean, includeMetadata: boolean): Promise<number> {
  const ingredients = [...INGREDIENTS_DATA];
  
  // Extend to 100 ingredients if needed
  const additionalIngredients = [
    // Continue with remaining ingredients from the original data
    { name: 'Fresh Lettuce', category: 'Fresh Vegetables', image: 'https://images.unsplash.com/photo-1556909114-5bb2cd73ad40?w=400&h=300&fit=crop&auto=format&q=80', description: 'Crisp leafy greens perfect for salads and wraps.', allergens: 'None', nutrition: 'Source of folate, vitamin K, and water' },
    { name: 'Brussels Sprouts', category: 'Fresh Vegetables', image: 'https://images.unsplash.com/photo-1510627498534-cf7e9002facc?w=400&h=300&fit=crop&auto=format&q=80', description: 'Mini cabbages packed with vitamins and fiber.', allergens: 'None', nutrition: 'High in vitamin C, K, and glucosinolates' },
    // Add more ingredients to reach 100...
  ];
  
  ingredients.push(...additionalIngredients);
  
  // Ensure we have enough ingredients
  while (ingredients.length < count) {
    const baseIngredients = ingredients.slice(0, 20);
    const index = (ingredients.length - 50) % baseIngredients.length;
    const extraIngredient = baseIngredients[index];
    ingredients.push({
      ...extraIngredient,
      name: `${extraIngredient.name} (Premium ${ingredients.length - 50 + 1})`
    });
  }
  
  let imported = 0;
  for (let i = 0; i < Math.min(count, ingredients.length); i++) {
    const ingredient = ingredients[i];
    const ingredientId = `ingredient_${Date.now()}_${imported}`;
    
    const ingredientData = {
      id: ingredientId,
      name: ingredient.name,
      common_name: ingredient.name.toLowerCase(),
      category: ingredient.category,
      description: ingredient.description,
      nutritional_info: ingredient.nutrition,
      allergen_info: ingredient.allergens,
      source: 'HealthScan Comprehensive Ingredient Database',
      api_source: 'Internal Curated Database',
      imported_at: new Date().toISOString(),
      external_id: `hs_ingredient_${i + 1}`,
      image_url: includeImages ? ingredient.image : null
    };
    
    await kv.set(ingredientId, ingredientData);
    imported++;
    
    // Add small delay every 20 records to prevent overwhelming the system
    if (imported % 20 === 0) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return imported;
}

export async function populateProducts(count: number, includeImages: boolean, includeMetadata: boolean): Promise<number> {
  const products = [...PRODUCTS_DATA];
  
  // Extend list if needed
  while (products.length < count) {
    const index = (products.length - 10) % 10;
    const baseProduct = products[index];
    products.push({
      ...baseProduct,
      name: `${baseProduct.name} (Premium Line ${products.length - 9})`
    });
  }
  
  let imported = 0;
  for (let i = 0; i < Math.min(count, products.length); i++) {
    const product = products[i];
    const productId = `product_${Date.now()}_${imported}`;
    
    const productData = {
      id: productId,
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: `${product.name} from ${product.brand} - premium quality ${product.category.toLowerCase()} product.`,
      ingredients: 'See product packaging for complete ingredient list',
      nutritional_profile: JSON.stringify({
        calories: Math.floor(Math.random() * 300) + 50,
        protein: Math.floor(Math.random() * 30) + 5,
        carbs: Math.floor(Math.random() * 40) + 10,
        fat: Math.floor(Math.random() * 20) + 2
      }),
      source: 'HealthScan Product Database',
      api_source: 'Internal Product Database',
      imported_at: new Date().toISOString(),
      external_id: `hs_product_${i + 1}`,
      image_url: includeImages ? generateReliableImageUrl('product', product.name) : null
    };
    
    await kv.set(productId, productData);
    imported++;
  }
  
  return imported;
}

export async function populateParasites(count: number, includeImages: boolean, includeMetadata: boolean): Promise<number> {
  let imported = 0;
  for (let i = 0; i < count; i++) {
    const parasiteId = `parasite_${Date.now()}_${imported}`;
    const parasiteData = {
      id: parasiteId,
      name: `Parasite ${i + 1}`,
      scientific_name: `Parasitus sample${i + 1}`,
      category: 'Biological Contaminants',
      description: `Sample parasite entry ${i + 1}`,
      source: 'HealthScan Parasite Database',
      imported_at: new Date().toISOString(),
      external_id: `hs_parasite_${i + 1}`,
      image_url: includeImages ? generateReliableImageUrl('parasite') : null
    };
    await kv.set(parasiteId, parasiteData);
    imported++;
  }
  return imported;
}

export async function populateScans(count: number, includeImages: boolean, includeMetadata: boolean): Promise<number> {
  let imported = 0;
  for (let i = 0; i < count; i++) {
    const scanId = `scan_${Date.now()}_${imported}`;
    const scanData = {
      id: scanId,
      name: `Scan ${i + 1}`,
      scan_type: 'Product Analysis',
      description: `Sample scan entry ${i + 1}`,
      results: JSON.stringify({ status: 'completed', score: Math.floor(Math.random() * 100) }),
      source: 'HealthScan Internal',
      imported_at: new Date().toISOString(),
      external_id: `hs_scan_${i + 1}`,
      image_url: includeImages ? generateReliableImageUrl('scan') : null
    };
    await kv.set(scanId, scanData);
    imported++;
  }
  return imported;
}

export async function populateMeals(count: number, includeImages: boolean, includeMetadata: boolean): Promise<number> {
  let imported = 0;
  for (let i = 0; i < count; i++) {
    const mealId = `meal_${Date.now()}_${imported}`;
    const mealData = {
      id: mealId,
      name: `Meal ${i + 1}`,
      meal_type: 'Balanced Meal',
      description: `Sample meal entry ${i + 1}`,
      ingredients: JSON.stringify(['ingredient1', 'ingredient2']),
      nutrition_profile: JSON.stringify({ calories: 400, protein: 25, carbs: 45, fat: 15 }),
      source: 'HealthScan Meal Database',
      imported_at: new Date().toISOString(),
      external_id: `hs_meal_${i + 1}`,
      image_url: includeImages ? generateReliableImageUrl('meal') : null
    };
    await kv.set(mealId, mealData);
    imported++;
  }
  return imported;
}