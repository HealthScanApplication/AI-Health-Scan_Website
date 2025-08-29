/**
 * Utility functions for formatting record IDs consistently across the application
 */

/**
 * Formats a database ID for display purposes
 * @param id - The database ID (UUID, number, or string)
 * @param prefix - Optional prefix for the ID (default: '#')
 * @param length - Minimum length for numeric IDs (default: 3)
 * @returns Formatted ID string
 */
export function formatId(id: string | number | undefined, prefix: string = '#', length: number = 3): string {
  if (!id) {
    return `${prefix}000`;
  }

  // Handle UUID format (keep first 8 characters)
  if (typeof id === 'string' && id.includes('-') && id.length > 20) {
    return `${prefix}${id.substring(0, 8).toUpperCase()}`;
  }

  // Handle numeric IDs
  if (typeof id === 'number' || (typeof id === 'string' && !isNaN(Number(id)))) {
    const numId = typeof id === 'number' ? id : Number(id);
    return `${prefix}${String(numId).padStart(length, '0')}`;
  }

  // Handle string IDs
  if (typeof id === 'string') {
    // If it's a short string, return as-is with prefix
    if (id.length <= 10) {
      return `${prefix}${id.toUpperCase()}`;
    }
    
    // If it's a long string, truncate
    return `${prefix}${id.substring(0, 8).toUpperCase()}`;
  }

  return `${prefix}UNK`;
}

/**
 * Generates a sequential display ID based on index
 * @param index - Zero-based index
 * @param prefix - Optional prefix (default: '#')
 * @param length - Minimum length for the number part (default: 3)
 * @returns Sequential ID string
 */
export function formatSequentialId(index: number, prefix: string = '#', length: number = 3): string {
  return `${prefix}${String(index + 1).padStart(length, '0')}`;
}

/**
 * Extracts a short identifier from a UUID
 * @param uuid - The UUID string
 * @returns Short identifier (first 8 characters)
 */
export function extractShortId(uuid: string): string {
  if (!uuid || typeof uuid !== 'string') {
    return 'UNKNOWN';
  }
  
  return uuid.substring(0, 8).toUpperCase();
}

/**
 * Formats an ID specifically for database records with additional context
 * @param record - The database record
 * @param index - Fallback index if no ID available
 * @param recordType - Type of record for context
 * @returns Formatted ID with type prefix
 */
export function formatRecordId(
  record: any, 
  index: number, 
  recordType: string = 'REC'
): string {
  // Use database ID if available
  if (record?.id) {
    return formatId(record.id);
  }

  // Use a type-specific prefix with sequential numbering
  const typePrefix = getTypePrefixShort(recordType);
  return `${typePrefix}${String(index + 1).padStart(3, '0')}`;
}

/**
 * Gets a short prefix for different record types
 * @param recordType - The type of record
 * @returns Short prefix string
 */
function getTypePrefixShort(recordType: string): string {
  const prefixes: Record<string, string> = {
    'nutrient': 'N',
    'ingredient': 'I',
    'pollutant': 'P',
    'product': 'PR',
    'scan': 'S',
    'parasite': 'PA',
    'meal': 'M'
  };

  return prefixes[recordType.toLowerCase()] || 'R';
}

/**
 * Validates if a string looks like a valid ID
 * @param id - The ID to validate
 * @returns Boolean indicating if the ID appears valid
 */
export function isValidId(id: any): boolean {
  if (!id) return false;
  
  if (typeof id === 'number') return id > 0;
  
  if (typeof id === 'string') {
    // Check for UUID pattern
    if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return true;
    }
    
    // Check for numeric string
    if (!isNaN(Number(id)) && Number(id) > 0) {
      return true;
    }
    
    // Check for other alphanumeric IDs
    if (id.length > 0 && id.match(/^[a-zA-Z0-9_-]+$/)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Creates a display-friendly version of any ID
 * @param id - The ID to make display-friendly
 * @param maxLength - Maximum length to display (default: 12)
 * @returns Display-friendly ID string
 */
export function makeDisplayFriendly(id: any, maxLength: number = 12): string {
  if (!id) return 'N/A';
  
  const idString = String(id);
  
  // If it's already short enough, return as-is
  if (idString.length <= maxLength) {
    return idString;
  }
  
  // If it's a UUID, show first part
  if (idString.includes('-')) {
    return idString.split('-')[0].toUpperCase();
  }
  
  // Truncate long strings
  return `${idString.substring(0, maxLength - 3)}...`;
}

/**
 * Formats multiple IDs for bulk display
 * @param ids - Array of IDs
 * @param separator - Separator between IDs (default: ', ')
 * @param maxDisplay - Maximum number of IDs to display (default: 3)
 * @returns Formatted string of IDs
 */
export function formatMultipleIds(
  ids: any[], 
  separator: string = ', ', 
  maxDisplay: number = 3
): string {
  if (!ids || ids.length === 0) return 'None';
  
  const formattedIds = ids
    .slice(0, maxDisplay)
    .map(id => makeDisplayFriendly(id))
    .join(separator);
  
  if (ids.length > maxDisplay) {
    return `${formattedIds} +${ids.length - maxDisplay} more`;
  }
  
  return formattedIds;
}