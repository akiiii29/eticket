// Performance monitoring utilities

export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  static startTimer(label: string): void {
    this.timers.set(label, performance.now());
  }

  static endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Timer '${label}' was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.timers.delete(label);
    
    // Log slow operations (> 1 second)
    if (duration > 1000) {
      console.warn(`🐌 Slow operation '${label}': ${duration.toFixed(2)}ms`);
    } else if (duration > 500) {
      console.log(`⏱️ Operation '${label}': ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  static measureAsync<T>(
    label: string, 
    asyncFn: () => Promise<T>
  ): Promise<T> {
    this.startTimer(label);
    return asyncFn().finally(() => {
      this.endTimer(label);
    });
  }
}

// Database query optimization helpers
export const QueryOptimizer = {
  // Debounce function calls
  debounce<T extends (...args: any[]) => any>(
    func: T, 
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function calls
  throttle<T extends (...args: any[]) => any>(
    func: T, 
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};
