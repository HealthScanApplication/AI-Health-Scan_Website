/**
 * Timeout Management Utility for HealthScan
 * Provides robust timeout handling with cancellation and retry logic
 */

export interface TimeoutConfig {
  defaultTimeout: number;
  maxTimeout: number;
  retryTimeouts: number[];
  abortOnTimeout: boolean;
}

export class TimeoutManager {
  private config: TimeoutConfig;
  private activeTimeouts: Set<number> = new Set();
  private controllers: Map<string, AbortController> = new Map();

  constructor(config: Partial<TimeoutConfig> = {}) {
    this.config = {
      defaultTimeout: 10000,
      maxTimeout: 30000,
      retryTimeouts: [5000, 10000, 15000],
      abortOnTimeout: true,
      ...config
    };
  }

  /**
   * Create a timeout-aware fetch operation
   */
  async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = this.config.defaultTimeout,
    operationId?: string
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, Math.min(timeout, this.config.maxTimeout));

    // Store controller for potential cancellation
    if (operationId) {
      this.controllers.set(operationId, controller);
    }

    this.activeTimeouts.add(timeoutId);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.activeTimeouts.delete(timeoutId);

      if (operationId) {
        this.controllers.delete(operationId);
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      this.activeTimeouts.delete(timeoutId);

      if (operationId) {
        this.controllers.delete(operationId);
      }

      if (error.name === 'AbortError') {
        throw new TimeoutError(`Operation timed out after ${timeout}ms`, timeout);
      }

      throw error;
    }
  }

  /**
   * Execute operation with progressive timeouts
   */
  async executeWithProgressiveTimeout<T>(
    operation: (timeout: number) => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> {
    const timeouts = this.config.retryTimeouts;
    let lastError: Error;

    for (let i = 0; i < timeouts.length; i++) {
      const timeout = timeouts[i];
      
      try {
        console.log(`🔄 Attempting ${operationName} with ${timeout}ms timeout (attempt ${i + 1}/${timeouts.length})`);
        
        const result = await operation(timeout);
        
        console.log(`✅ ${operationName} succeeded with ${timeout}ms timeout`);
        return result;
      } catch (error: any) {
        lastError = error;
        
        if (error instanceof TimeoutError) {
          console.warn(`⏱️ ${operationName} timed out after ${timeout}ms`);
          
          if (i < timeouts.length - 1) {
            console.log(`🔄 Retrying ${operationName} with longer timeout...`);
            continue;
          }
        } else {
          // Non-timeout errors should not be retried
          console.error(`❌ ${operationName} failed with non-timeout error:`, error.message);
          throw error;
        }
      }
    }

    throw new TimeoutError(
      `${operationName} failed after trying timeouts: ${timeouts.join(', ')}ms`,
      Math.max(...timeouts)
    );
  }

  /**
   * Cancel a specific operation
   */
  cancelOperation(operationId: string): boolean {
    const controller = this.controllers.get(operationId);
    if (controller) {
      controller.abort();
      this.controllers.delete(operationId);
      return true;
    }
    return false;
  }

  /**
   * Cancel all active operations
   */
  cancelAllOperations(): void {
    for (const [operationId, controller] of this.controllers) {
      controller.abort();
    }
    this.controllers.clear();

    for (const timeoutId of this.activeTimeouts) {
      clearTimeout(timeoutId);
    }
    this.activeTimeouts.clear();
  }

  /**
   * Get current timeout configuration
   */
  getConfig(): TimeoutConfig {
    return { ...this.config };
  }

  /**
   * Update timeout configuration
   */
  updateConfig(newConfig: Partial<TimeoutConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get active operations count
   */
  getActiveOperationsCount(): number {
    return this.controllers.size;
  }

  /**
   * Check if operation is active
   */
  isOperationActive(operationId: string): boolean {
    return this.controllers.has(operationId);
  }
}

/**
 * Custom timeout error class
 */
export class TimeoutError extends Error {
  public readonly timeout: number;
  public readonly name = 'TimeoutError';

  constructor(message: string, timeout: number) {
    super(message);
    this.timeout = timeout;
  }
}

/**
 * Global timeout manager instance
 */
export const globalTimeoutManager = new TimeoutManager({
  defaultTimeout: 15000,
  maxTimeout: 45000,
  retryTimeouts: [10000, 20000, 30000],
  abortOnTimeout: true
});

/**
 * Helper function to create timeout-aware fetch
 */
export const timeoutFetch = (
  url: string,
  options: RequestInit = {},
  timeout: number = 15000,
  operationId?: string
): Promise<Response> => {
  return globalTimeoutManager.fetchWithTimeout(url, options, timeout, operationId);
};

/**
 * Helper function to execute with progressive timeouts
 */
export const executeWithRetry = <T>(
  operation: (timeout: number) => Promise<T>,
  operationName: string = 'operation'
): Promise<T> => {
  return globalTimeoutManager.executeWithProgressiveTimeout(operation, operationName);
};