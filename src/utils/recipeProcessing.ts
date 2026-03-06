/**
 * Recipe Processing Utilities
 * 
 * Helpers for stripping processing words from ingredient names
 * and detecting processing methods automatically.
 */

import { PROCESSING_METHODS } from '../components/admin/fields/CookingToolsField';

const PROCESSING_LOWER = PROCESSING_METHODS.map(p => p.toLowerCase());

/**
 * Strip leading processing word from an ingredient name and return the clean name
 * plus the detected processing method.
 * 
 * Examples:
 *   "Chopped Tomatoes" → { cleanName: "Tomatoes", detectedProcessing: "Chopped" }
 *   "Olive Oil"        → { cleanName: "Olive Oil", detectedProcessing: null }
 *   "Minced Garlic"    → { cleanName: "Garlic", detectedProcessing: "Minced" }
 */
export function stripProcessing(name: string): { cleanName: string; detectedProcessing: string | null } {
  if (!name) return { cleanName: name, detectedProcessing: null };
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return { cleanName: name, detectedProcessing: null };
  const firstWord = words[0].toLowerCase();
  const idx = PROCESSING_LOWER.indexOf(firstWord);
  if (idx !== -1) {
    return { cleanName: words.slice(1).join(' '), detectedProcessing: PROCESSING_METHODS[idx] };
  }
  return { cleanName: name, detectedProcessing: null };
}

/**
 * Get a clean display name for an ingredient record,
 * stripping any leading processing word.
 */
export function cleanIngredientName(ing: { name_common?: string; name?: string }): string {
  const raw = ing.name_common || ing.name || '';
  return stripProcessing(raw).cleanName;
}
