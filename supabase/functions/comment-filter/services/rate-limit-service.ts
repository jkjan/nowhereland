interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export class RateLimitService {
  private static readonly WINDOW_SIZE = 3600000; // 1 hour in milliseconds
  private static readonly RATE_LIMIT = 5; // 5 requests per hour
  private static rateLimitMap = new Map<string, RateLimitEntry>();

  static checkRateLimit(clientIP: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(clientIP);

    if (!entry) {
      // First request from this IP
      this.rateLimitMap.set(clientIP, {
        count: 1,
        windowStart: now
      });
      return true;
    }

    // Check if we're in a new window
    if (now - entry.windowStart > this.WINDOW_SIZE) {
      // Reset window
      this.rateLimitMap.set(clientIP, {
        count: 1,
        windowStart: now
      });
      return true;
    }

    // Same window, check if limit exceeded
    if (entry.count >= this.RATE_LIMIT) {
      return false;
    }

    // Increment count
    entry.count++;
    return true;
  }

  static getRemainingRequests(clientIP: string): number {
    const entry = this.rateLimitMap.get(clientIP);
    if (!entry) return this.RATE_LIMIT;

    const now = Date.now();
    if (now - entry.windowStart > this.WINDOW_SIZE) {
      return this.RATE_LIMIT;
    }

    return Math.max(0, this.RATE_LIMIT - entry.count);
  }

  static getResetTime(clientIP: string): number {
    const entry = this.rateLimitMap.get(clientIP);
    if (!entry) return 0;

    return entry.windowStart + this.WINDOW_SIZE;
  }

  // Clean up old entries periodically
  static cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.rateLimitMap.entries()) {
      if (now - entry.windowStart > this.WINDOW_SIZE) {
        this.rateLimitMap.delete(ip);
      }
    }
  }
}