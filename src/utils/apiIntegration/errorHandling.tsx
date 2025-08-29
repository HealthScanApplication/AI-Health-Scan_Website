/**
 * Production API Error Handling
 * Handles real API errors without mock data fallbacks
 */

import { APIResponse, API_ERROR_CODES } from './constants';

export class APIErrorHandler {
  static handleError(error: any, apiName: string): APIResponse<any> {
    console.error(`🚨 Production API Error - ${apiName}:`, error);
    
    let errorMessage = '';
    let troubleshooting: string[] = [];
    
    // Determine error type and provide production guidance
    if (error.message.includes('401') || error.status === API_ERROR_CODES.AUTHENTICATION_FAILED) {
      errorMessage = `Authentication failed for ${apiName} API`;
      troubleshooting = [
        'Verify your API key is correct and active',
        'Check if your API subscription is still valid',
        'Ensure the API key has the required permissions',
        'Contact your API provider if the issue persists'
      ];
    } else if (error.message.includes('429') || error.status === API_ERROR_CODES.RATE_LIMIT_EXCEEDED) {
      errorMessage = `Rate limit exceeded for ${apiName} API`;
      troubleshooting = [
        'Wait before making additional requests',
        'Consider upgrading your API plan for higher limits',
        'Implement request batching to reduce frequency',
        'Check your current usage against your plan limits'
      ];
    } else if (error.message.includes('503') || error.status === API_ERROR_CODES.API_UNAVAILABLE) {
      errorMessage = `${apiName} API is currently unavailable`;
      troubleshooting = [
        'Check the API provider\'s status page',
        'Try again in a few minutes',
        'Verify your internet connection',
        'Contact support if the outage is prolonged'
      ];
    } else if (error.message.includes('400') || error.status === API_ERROR_CODES.INVALID_REQUEST) {
      errorMessage = `Invalid request to ${apiName} API`;
      troubleshooting = [
        'Check the request parameters and format',
        'Verify the API endpoint URL is correct',
        'Ensure all required fields are provided',
        'Review the API documentation for parameter requirements'
      ];
    } else if (error.message.includes('404') || error.status === API_ERROR_CODES.NOT_FOUND) {
      errorMessage = `${apiName} API endpoint not found`;
      troubleshooting = [
        'Verify the API endpoint URL is correct',
        'Check if the API version is still supported',
        'Ensure the resource you\'re requesting exists',
        'Contact the API provider if the endpoint should exist'
      ];
    } else if (error.message.includes('500') || error.status === API_ERROR_CODES.SERVER_ERROR) {
      errorMessage = `${apiName} API server error`;
      troubleshooting = [
        'This is a server-side issue with the API provider',
        'Try again in a few minutes',
        'Check the API provider\'s status page',
        'Report the issue to the API provider if it persists'
      ];
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = `Network error connecting to ${apiName} API`;
      troubleshooting = [
        'Check your internet connection',
        'Verify the API endpoint URL is reachable',
        'Check if there are any firewall restrictions',
        'Try accessing the API from a different network'
      ];
    } else if (error.name === 'AbortError') {
      errorMessage = `Request to ${apiName} API timed out`;
      troubleshooting = [
        'The API response took too long',
        'Try reducing the request size or complexity',
        'Check if the API is experiencing high load',
        'Consider increasing the timeout duration'
      ];
    } else {
      errorMessage = `Unexpected error with ${apiName} API: ${error.message}`;
      troubleshooting = [
        'This is an unexpected error type',
        'Check the browser console for more details',
        'Verify all API credentials and configuration',
        'Contact technical support with the error details'
      ];
    }
    
    // Log detailed error information for debugging
    console.error(`🔍 Error Details:`, {
      apiName,
      errorMessage,
      originalError: error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      troubleshooting
    });
    
    return {
      success: false,
      error: errorMessage,
      metadata: { 
        total: 0, 
        imported: 0, 
        skipped: 0, 
        errors: [errorMessage, ...troubleshooting] 
      }
    };
  }

  static createNetworkError(apiName: string, statusCode: number, statusText: string): Error {
    const error = new Error(`${apiName} API error: ${statusCode} ${statusText}`);
    (error as any).status = statusCode;
    return error;
  }

  static createTimeoutError(apiName: string, timeoutMs: number): Error {
    const error = new Error(`${apiName} API request timed out after ${timeoutMs}ms`);
    error.name = 'AbortError';
    return error;
  }

  static createAuthenticationError(apiName: string): Error {
    const error = new Error(`Authentication failed for ${apiName} API - check your API key`);
    (error as any).status = API_ERROR_CODES.AUTHENTICATION_FAILED;
    return error;
  }

  static createRateLimitError(apiName: string, resetTime?: number): Error {
    const resetMessage = resetTime 
      ? ` Resets at ${new Date(resetTime).toLocaleTimeString()}`
      : '';
    const error = new Error(`${apiName} rate limit exceeded.${resetMessage}`);
    (error as any).status = API_ERROR_CODES.RATE_LIMIT_EXCEEDED;
    return error;
  }

  static validateAPIResponse(response: Response, apiName: string): void {
    if (!response.ok) {
      throw this.createNetworkError(apiName, response.status, response.statusText);
    }
  }

  static async handleAPICall<T>(
    apiCall: () => Promise<Response>,
    apiName: string,
    timeoutMs: number = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await apiCall();
      clearTimeout(timeoutId);
      this.validateAPIResponse(response, apiName);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw this.createTimeoutError(apiName, timeoutMs);
      }
      throw error;
    }
  }
}

// Production API monitoring utilities
export class APIMonitoring {
  private static metrics: Record<string, {
    totalRequests: number;
    successfulRequests: number;
    errorRequests: number;
    averageResponseTime: number;
    lastError?: string;
    lastErrorTime?: string;
  }> = {};

  static recordAPICall(apiName: string, success: boolean, responseTime: number, error?: string) {
    if (!this.metrics[apiName]) {
      this.metrics[apiName] = {
        totalRequests: 0,
        successfulRequests: 0,
        errorRequests: 0,
        averageResponseTime: 0
      };
    }

    const metric = this.metrics[apiName];
    metric.totalRequests++;
    
    if (success) {
      metric.successfulRequests++;
    } else {
      metric.errorRequests++;
      metric.lastError = error;
      metric.lastErrorTime = new Date().toISOString();
    }

    // Update average response time
    metric.averageResponseTime = (
      (metric.averageResponseTime * (metric.totalRequests - 1) + responseTime) / 
      metric.totalRequests
    );
  }

  static getAPIMetrics(apiName?: string) {
    return apiName ? this.metrics[apiName] : this.metrics;
  }

  static getAPIHealthScore(apiName: string): number {
    const metric = this.metrics[apiName];
    if (!metric || metric.totalRequests === 0) return 100;
    
    const successRate = (metric.successfulRequests / metric.totalRequests) * 100;
    return Math.round(successRate);
  }
}