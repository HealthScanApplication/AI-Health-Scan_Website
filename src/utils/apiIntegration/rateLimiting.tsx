/**
 * Rate Limiting Utilities
 */

// Rate limiting utility class
export class RateLimiter {
  private requests: { [key: string]: number[] } = {};

  canMakeRequest(apiId: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests[apiId]) {
      this.requests[apiId] = [];
    }
    
    // Remove old requests outside the window
    this.requests[apiId] = this.requests[apiId].filter(time => time > windowStart);
    
    return this.requests[apiId].length < maxRequests;
  }

  recordRequest(apiId: string): void {
    if (!this.requests[apiId]) {
      this.requests[apiId] = [];
    }
    this.requests[apiId].push(Date.now());
  }

  getRemainingRequests(apiId: string, maxRequests: number, windowMs: number): number {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests[apiId]) {
      return maxRequests;
    }
    
    const recentRequests = this.requests[apiId].filter(time => time > windowStart);
    return Math.max(0, maxRequests - recentRequests.length);
  }

  getResetTime(apiId: string, windowMs: number): number {
    if (!this.requests[apiId] || this.requests[apiId].length === 0) {
      return 0;
    }
    
    const oldestRequest = Math.min(...this.requests[apiId]);
    return oldestRequest + windowMs;
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();