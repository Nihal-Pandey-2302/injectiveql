import { Request, Response, NextFunction } from 'express';
import redis from '@config/redis';
import { N1NJ4Verifier } from '@routes/identity';

interface RateLimitConfig {
  default: number;
  standard: number;
  premium: number;
}

export class RateLimiter {
  private static config: RateLimitConfig = {
    default: parseInt(process.env.RATE_LIMIT_DEFAULT || '100'),
    standard: parseInt(process.env.RATE_LIMIT_STANDARD || '500'),
    premium: parseInt(process.env.RATE_LIMIT_PREMIUM || '2000'),
  };

  static middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get client identifier (IP or address)
        const address = req.headers['x-injective-address'] as string;
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const identifier = address || ip;

        // Determine rate limit tier
        let limit = this.config.default;
        
        if (address) {
          const verification = await N1NJ4Verifier.verifyOwnership(address);
          if (verification.tier === 'premium') {
            limit = this.config.premium;
          } else if (verification.tier === 'standard') {
            limit = this.config.standard;
          }
        }

        // Check current count
        const key = `ratelimit:${identifier}:${this.getCurrentHour()}`;
        const current = await redis.incr(key);

        // Set expiry on first request
        if (current === 1) {
          await redis.expire(key, 3600); // 1 hour
        }

        // Set response headers
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
        res.setHeader('X-RateLimit-Reset', this.getNextHourTimestamp());

        // Check if exceeded
        if (current > limit) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            limit,
            reset: this.getNextHourTimestamp(),
          });
        }

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        // On error, allow the request
        next();
      }
    };
  }

  private static getCurrentHour(): string {
    return new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
  }

  private static getNextHourTimestamp(): number {
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);
    return Math.floor(nextHour.getTime() / 1000);
  }
}
