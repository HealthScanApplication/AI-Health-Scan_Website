/**
 * Unified Formatting Utilities
 * ============================
 * Consolidated date, number, and text formatting functions
 * Used across components to ensure consistent formatting
 */

/**
 * Format date string to localized display format
 * @param dateString - ISO date string or Date object
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string or fallback
 */
export function formatDate(
  dateString: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Check for invalid date
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    };
    
    return date.toLocaleDateString('en-US', defaultOptions);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format date without time (date only)
 */
export function formatDateOnly(dateString: string | Date | null | undefined): string {
  return formatDate(dateString, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Format date to relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return formatDateOnly(date);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format number with commas
 */
export function formatNumber(num: number | null | undefined, decimals = 0): string {
  if (num === null || num === undefined) return 'N/A';
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Format currency (USD)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string | null | undefined, maxLength = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string | null | undefined): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitle(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
}
