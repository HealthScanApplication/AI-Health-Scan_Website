import { toast } from 'sonner';

export interface AppError {
  message: string;
  code?: string;
  details?: any;
  context?: string;
}

export class HealthScanError extends Error {
  code?: string;
  details?: any;
  context?: string;

  constructor({ message, code, details, context }: AppError) {
    super(message);
    this.name = 'HealthScanError';
    this.code = code;
    this.details = details;
    this.context = context;
  }
}

export function handleError(error: unknown, context?: string): void {
  console.error(`Error in ${context || 'unknown context'}:`, error);

  let message = 'An unexpected error occurred';
  let shouldShowToast = true;

  if (error instanceof HealthScanError) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  // Don't show redundant toasts for certain error types
  const suppressToastPatterns = [
    /network/i,
    /connection/i,
    /timeout/i
  ];

  shouldShowToast = !suppressToastPatterns.some(pattern => pattern.test(message));

  if (shouldShowToast) {
    toast.error(message);
  }

  // Log error details for debugging
  if (context) {
    console.error(`Context: ${context}`);
  }
  
  if (error instanceof HealthScanError && error.details) {
    console.error('Error details:', error.details);
  }
}

export function createErrorHandler(context: string) {
  return (error: unknown) => handleError(error, context);
}

// Async wrapper with error handling
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  context: string,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error, context);
    return fallbackValue;
  }
}

// Type guard for checking if an error has specific properties
export function isHealthScanError(error: unknown): error is HealthScanError {
  return error instanceof HealthScanError;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return /network|connection|timeout|fetch/i.test(error.message);
  }
  return false;
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    return /auth|unauthorized|forbidden/i.test(error.message);
  }
  return false;
}

// Error boundary helper
export function getErrorMessage(error: unknown): string {
  if (error instanceof HealthScanError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}