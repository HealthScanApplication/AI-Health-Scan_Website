import { projectId, publicAnonKey } from './supabase/info';

interface AIContentRequest {
  fieldName: string;
  fieldType: string;
  currentValue: string;
  nutrientName: string;
  category: string;
  contextData?: any;
  maxLength?: number;
  minLength?: number;
  isArray?: boolean;
}

interface AIContentResponse {
  success: boolean;
  content: string | string[];
  error?: string;
  characterCount?: number;
  guidance?: string;
}

// Field-specific prompts and character requirements
const FIELD_CONFIGURATIONS = {
  name: {
    prompt: "Generate a scientifically accurate nutrient name",
    minLength: 2,
    maxLength: 100,
    example: "Vitamin A, Magnesium, Omega-3 Fatty Acids"
  },
  simple_description: {
    prompt: "Write a clear, accessible description that explains what this nutrient is and why it's important for general audiences. Use simple language that anyone can understand.",
    minLength: 50,
    maxLength: 500,
    example: "A vitamin essential for good vision, healthy skin, immune function, and growth."
  },
  technical_description: {
    prompt: "Provide a detailed scientific explanation including biochemical mechanisms, molecular structure, and physiological processes. Use proper scientific terminology.",
    minLength: 100,
    maxLength: 1000,
    example: "Vitamin A is a group of fat-soluble retinoids including retinol, retinal, and retinyl esters..."
  },
  primary_function: {
    prompt: "Summarize the most important physiological functions this nutrient performs in the human body.",
    minLength: 20,
    maxLength: 200,
    example: "Supports vision, immune health, and cell development."
  },
  measurement_unit: {
    prompt: "Provide the standard scientific measurement unit for this nutrient",
    minLength: 2,
    maxLength: 20,
    example: "mcg RAE/day, mg/day, IU/day"
  },
  health_benefits: {
    prompt: "List 4-8 specific, evidence-based health benefits of this nutrient. Each benefit should be concise and actionable.",
    minLength: 10,
    maxLength: 100,
    isArray: true,
    example: ["Improves night vision", "Enhances immune function"]
  },
  deficiency_symptoms: {
    prompt: "List 4-8 specific symptoms that occur when someone is deficient in this nutrient. Focus on clinically recognized symptoms.",
    minLength: 10,
    maxLength: 80,
    isArray: true,
    example: ["Night blindness", "Frequent infections"]
  },
  excess_symptoms: {
    prompt: "List 4-8 specific symptoms or health risks that can occur from consuming too much of this nutrient.",
    minLength: 10,
    maxLength: 80,
    isArray: true,
    example: ["Liver toxicity", "Birth defects"]
  },
  functions: {
    prompt: "List 3-6 primary physiological functions or roles this nutrient plays in the body. Use concise, scientific terms.",
    minLength: 5,
    maxLength: 30,
    isArray: true,
    example: ["Vision", "Immune Defense", "Cell Growth"]
  },
  synergistic_nutrients: {
    prompt: "List nutrients that work together with or enhance the absorption/function of this nutrient.",
    minLength: 3,
    maxLength: 20,
    isArray: true,
    example: ["Zinc", "Vitamin E", "Fat"]
  },
  depleting_factors: {
    prompt: "List substances, medications, or lifestyle factors that can deplete or interfere with this nutrient.",
    minLength: 3,
    maxLength: 30,
    isArray: true,
    example: ["Alcohol", "Smoking", "Statins"]
  },
  absorption_requirements: {
    prompt: "Explain in detail how this nutrient is absorbed in the body, what factors enhance or inhibit absorption, and any special requirements for optimal bioavailability.",
    minLength: 100,
    maxLength: 800,
    example: "Vitamin A is absorbed in the small intestine but requires 3–5g of dietary fat per meal..."
  },
  food_strategy_animal_title: {
    prompt: "Create a concise title for animal-based food sources of this nutrient",
    minLength: 5,
    maxLength: 50,
    example: "Animal Retinol Sources"
  },
  food_strategy_animal_description: {
    prompt: "Provide detailed strategy for obtaining this nutrient from animal sources, including specific foods, quantities, and consumption recommendations.",
    minLength: 100,
    maxLength: 600,
    example: "Small amounts go a long way. Just 25g of beef liver provides 2.25 mg..."
  },
  food_strategy_plant_title: {
    prompt: "Create a concise title for plant-based food sources of this nutrient",
    minLength: 5,
    maxLength: 50,
    example: "Plant Carotenoids"
  },
  food_strategy_plant_description: {
    prompt: "Provide detailed strategy for obtaining this nutrient from plant sources, including specific foods, quantities, and preparation methods.",
    minLength: 100,
    maxLength: 600,
    example: "Plant sources are converted into Vitamin A as needed by the body..."
  },
  key_interactions_description: {
    prompt: "Provide a brief overview of how this nutrient interacts with other nutrients",
    minLength: 10,
    maxLength: 100,
    example: "What it works with and against"
  },
  pregnancy_summary: {
    prompt: "Summarize the importance of this nutrient during pregnancy in one clear sentence",
    minLength: 20,
    maxLength: 200,
    example: "Crucial for fetal organ and nervous system development."
  },
  pregnancy_guidance: {
    prompt: "Provide detailed pregnancy-specific guidance including safety thresholds, recommendations, and any special considerations.",
    minLength: 100,
    maxLength: 800,
    example: "Excess (>10,000 IU/day or >3 mg retinol) can be teratogenic..."
  },
  when_to_supplement: {
    prompt: "Provide comprehensive guidance on when supplementation is appropriate, including dosing recommendations, timing, and safety considerations.",
    minLength: 100,
    maxLength: 800,
    example: "Use only if deficient or at risk. Limit preformed A (retinol) to <3 mg..."
  },
  form_name: {
    prompt: "Name a specific chemical form of this nutrient",
    minLength: 3,
    maxLength: 50,
    example: "Retinol, Beta-Carotene, Cyanocobalamin"
  },
  form_type: {
    prompt: "Classify the type or category of this nutrient form",
    minLength: 5,
    maxLength: 50,
    example: "Preformed, Synthetic, Natural"
  },
  bioavailability_notes: {
    prompt: "Explain the bioavailability characteristics and absorption factors for this specific form",
    minLength: 20,
    maxLength: 200,
    example: "Highly bioavailable in animal foods"
  },
  food_name: {
    prompt: "Name a specific food that is a good source of this nutrient",
    minLength: 3,
    maxLength: 50,
    example: "Beef Liver, Sweet Potato, Salmon"
  },
  interaction_name: {
    prompt: "Name a nutrient that interacts with this nutrient",
    minLength: 3,
    maxLength: 30,
    example: "Zinc, Iron, Vitamin E"
  },
  interaction_mechanism: {
    prompt: "Explain how this nutrient interaction works at a biochemical level",
    minLength: 20,
    maxLength: 150,
    example: "Enables transport (retinol-binding protein)"
  },
  supplement_name: {
    prompt: "Name a high-quality supplement product for this nutrient",
    minLength: 10,
    maxLength: 80,
    example: "Nordic Naturals Vitamin A"
  },
  supplement_description: {
    prompt: "Describe this supplement including dosage, form, source, and quality indicators",
    minLength: 30,
    maxLength: 300,
    example: "Preformed Retinol (1,500 mcg), sourced from cod liver oil. Third-party tested."
  }
};

export async function generateAIContent(request: AIContentRequest): Promise<AIContentResponse> {
  try {
    console.log(`🤖 Generating AI content for field: ${request.fieldName}`);
    
    const fieldConfig = FIELD_CONFIGURATIONS[request.fieldName as keyof typeof FIELD_CONFIGURATIONS];
    
    if (!fieldConfig) {
      return {
        success: false,
        error: `No configuration found for field: ${request.fieldName}`
      };
    }

    // Build context-aware prompt
    const contextPrompt = buildContextPrompt(request, fieldConfig);
    
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/generate-ai-content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: contextPrompt,
        fieldName: request.fieldName,
        isArray: fieldConfig.isArray,
        maxLength: request.maxLength || fieldConfig.maxLength,
        minLength: request.minLength || fieldConfig.minLength,
        nutrientContext: {
          name: request.nutrientName,
          category: request.category
        }
      })
    });

    if (!response.ok) {
      throw new Error(`AI content generation failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ AI content generated for ${request.fieldName}:`, result.content);
      return {
        success: true,
        content: result.content,
        characterCount: typeof result.content === 'string' ? result.content.length : result.content?.length,
        guidance: generateFieldGuidance(fieldConfig, result.content)
      };
    } else {
      throw new Error(result.error || 'AI content generation failed');
    }
  } catch (error: any) {
    console.error('❌ AI content generation error:', error);
    return {
      success: false,
      error: error.message,
      guidance: generateFieldGuidance(fieldConfig)
    };
  }
}

function buildContextPrompt(request: AIContentRequest, fieldConfig: any): string {
  const basePrompt = fieldConfig.prompt;
  const nutrientContext = request.nutrientName ? ` for ${request.nutrientName}` : '';
  const categoryContext = request.category ? ` (${request.category})` : '';
  
  let prompt = `${basePrompt}${nutrientContext}${categoryContext}.`;
  
  // Add character length requirements
  if (fieldConfig.minLength || fieldConfig.maxLength) {
    prompt += `\n\nLength requirements:`;
    if (fieldConfig.minLength) prompt += ` Minimum ${fieldConfig.minLength} characters.`;
    if (fieldConfig.maxLength) prompt += ` Maximum ${fieldConfig.maxLength} characters.`;
  }
  
  // Add array-specific instructions
  if (fieldConfig.isArray) {
    prompt += `\n\nFormat: Return as a JSON array of strings. Each item should be concise and specific.`;
  }
  
  // Add example if available
  if (fieldConfig.example) {
    prompt += `\n\nExample: ${Array.isArray(fieldConfig.example) ? JSON.stringify(fieldConfig.example) : fieldConfig.example}`;
  }
  
  // Add current value context if available
  if (request.currentValue && request.currentValue.trim()) {
    prompt += `\n\nCurrent value: "${request.currentValue}". Improve or expand on this if needed.`;
  }
  
  return prompt;
}

function generateFieldGuidance(fieldConfig: any, content?: string | string[]): string {
  let guidance = '';
  
  if (fieldConfig.minLength || fieldConfig.maxLength) {
    guidance += `Character requirements: `;
    if (fieldConfig.minLength) guidance += `min ${fieldConfig.minLength}`;
    if (fieldConfig.minLength && fieldConfig.maxLength) guidance += `, `;
    if (fieldConfig.maxLength) guidance += `max ${fieldConfig.maxLength}`;
    guidance += ` characters. `;
  }
  
  if (content) {
    const length = typeof content === 'string' ? content.length : content.length;
    guidance += `Current: ${length} characters. `;
    
    if (fieldConfig.minLength && length < fieldConfig.minLength) {
      guidance += `⚠️ Too short (need ${fieldConfig.minLength - length} more). `;
    } else if (fieldConfig.maxLength && length > fieldConfig.maxLength) {
      guidance += `⚠️ Too long (reduce by ${length - fieldConfig.maxLength}). `;
    } else {
      guidance += `✅ Good length. `;
    }
  }
  
  return guidance.trim();
}

// Helper function to get field configuration
export function getFieldConfiguration(fieldName: string) {
  return FIELD_CONFIGURATIONS[fieldName as keyof typeof FIELD_CONFIGURATIONS];
}

// Helper function to validate field content
export function validateFieldContent(fieldName: string, content: string | string[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const config = getFieldConfiguration(fieldName);
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!config) {
    return { isValid: true, errors, warnings };
  }
  
  if (config.isArray) {
    const arrayContent = Array.isArray(content) ? content : [];
    
    arrayContent.forEach((item, index) => {
      if (typeof item === 'string') {
        if (config.minLength && item.length < config.minLength) {
          errors.push(`Item ${index + 1} too short (${item.length}/${config.minLength})`);
        }
        if (config.maxLength && item.length > config.maxLength) {
          errors.push(`Item ${index + 1} too long (${item.length}/${config.maxLength})`);
        }
      }
    });
  } else {
    const stringContent = typeof content === 'string' ? content : '';
    
    if (config.minLength && stringContent.length < config.minLength) {
      errors.push(`Too short (${stringContent.length}/${config.minLength} characters)`);
    }
    if (config.maxLength && stringContent.length > config.maxLength) {
      errors.push(`Too long (${stringContent.length}/${config.maxLength} characters)`);
    }
    
    // Warnings for approaching limits
    if (config.maxLength && stringContent.length > config.maxLength * 0.9) {
      warnings.push(`Approaching character limit (${stringContent.length}/${config.maxLength})`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}