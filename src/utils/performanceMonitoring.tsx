interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  
  // Start timing a metric
  startTiming(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }

  // End timing a metric
  endTiming(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    this.metrics.set(name, {
      ...metric,
      endTime,
      duration
    });

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Get all metrics
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  // Get specific metric
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
  }

  // Monitor Core Web Vitals
  monitorWebVitals(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    // Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    });

    // First Input Delay
    this.observeMetric('first-input', (entries) => {
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime);
      });
    });

    // Cumulative Layout Shift
    this.observeMetric('layout-shift', (entries) => {
      let cumulativeScore = 0;
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          cumulativeScore += entry.value;
        }
      });
      if (cumulativeScore > 0) {
        console.log('CLS:', cumulativeScore);
      }
    });
  }

  // Generic metric observer
  private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ entryTypes: [type] });
      this.observers.set(type, observer);
    } catch (error) {
      console.warn(`Could not observe ${type} metrics:`, error);
    }
  }

  // Monitor React component rendering
  monitorComponentRender(componentName: string): {
    start: () => void;
    end: () => void;
  } {
    return {
      start: () => this.startTiming(`component-render-${componentName}`),
      end: () => this.endTiming(`component-render-${componentName}`)
    };
  }

  // Monitor API calls
  monitorApiCall(endpoint: string): {
    start: () => void;
    end: (status?: number) => void;
  } {
    return {
      start: () => this.startTiming(`api-call-${endpoint}`),
      end: (status?: number) => {
        const duration = this.endTiming(`api-call-${endpoint}`);
        if (duration && duration > 5000) {
          console.warn(`Slow API call: ${endpoint} took ${duration.toFixed(2)}ms`);
        }
        if (status && status >= 400) {
          console.error(`API call failed: ${endpoint} returned ${status}`);
        }
      }
    };
  }

  // Get performance summary
  getSummary(): {
    totalMetrics: number;
    slowOperations: PerformanceMetric[];
    averageRenderTime: number;
    averageApiTime: number;
  } {
    const metrics = this.getMetrics();
    const slowOperations = metrics.filter(m => m.duration && m.duration > 1000);
    
    const renderMetrics = metrics.filter(m => m.name.startsWith('component-render-'));
    const apiMetrics = metrics.filter(m => m.name.startsWith('api-call-'));
    
    const averageRenderTime = renderMetrics.length > 0 
      ? renderMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / renderMetrics.length 
      : 0;
      
    const averageApiTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / apiMetrics.length
      : 0;

    return {
      totalMetrics: metrics.length,
      slowOperations,
      averageRenderTime,
      averageApiTime
    };
  }

  // Cleanup observers
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.clearMetrics();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

import { useEffect } from 'react';

// React hook for performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  const monitor = performanceMonitor.monitorComponentRender(componentName);
  
  // Start monitoring on mount
  useEffect(() => {
    monitor.start();
    return () => {
      monitor.end();
    };
  }, []);

  return {
    startTiming: (name: string) => performanceMonitor.startTiming(name),
    endTiming: (name: string) => performanceMonitor.endTiming(name),
    getMetrics: () => performanceMonitor.getMetrics()
  };
}

// Initialize performance monitoring
export function initializePerformanceMonitoring(): void {
  if (typeof window !== 'undefined') {
    performanceMonitor.monitorWebVitals();
    
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          console.log('Page Load Metrics:', {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            totalLoadTime: navigation.loadEventEnd - navigation.navigationStart
          });
        }
      }, 0);
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      performanceMonitor.cleanup();
    });
  }
}