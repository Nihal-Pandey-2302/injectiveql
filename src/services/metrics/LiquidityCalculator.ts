import { InjectiveService } from '@config/injective';
import { AppDataSource } from '@config/database';
import { MetricsCache } from '@entities/MetricsCache';
import { CacheService } from '@config/redis';

export interface LiquidityMetric {
  marketId: string;
  score: number;
  bidDepth: number;
  askDepth: number;
  spread: number;
  computedAt: string;
}

export class LiquidityCalculator {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly DEPTH_PERCENTAGE = 0.02; // ±2% from mid price

  static async calculate(marketId: string): Promise<LiquidityMetric | null> {
    try {
      // Fetch orderbook
      const orderbook = await InjectiveService.getMarketOrderbook(marketId, true);

      if (!orderbook.buys?.length || !orderbook.sells?.length) {
        return null;
      }

      // Get mid price
      const bestBid = parseFloat(orderbook.buys[0].price);
      const bestAsk = parseFloat(orderbook.sells[0].price);
      const midPrice = (bestBid + bestAsk) / 2;
      const spread = ((bestAsk - bestBid) / midPrice) * 100;

      // Calculate depth within ±2%
      const bidThreshold = midPrice * (1 - this.DEPTH_PERCENTAGE);
      const askThreshold = midPrice * (1 + this.DEPTH_PERCENTAGE);

      let bidDepth = 0;
      let askDepth = 0;

      for (const bid of orderbook.buys) {
        const price = parseFloat(bid.price);
        if (price >= bidThreshold) {
          bidDepth += parseFloat(bid.quantity) * price;
        }
      }

      for (const ask of orderbook.sells) {
        const price = parseFloat(ask.price);
        if (price <= askThreshold) {
          askDepth += parseFloat(ask.quantity) * price;
        }
      }

      const totalDepth = bidDepth + askDepth;

      // Calculate liquidity score (higher is better)
      // Formula: log(totalDepth) * (1 - spread/100)
      const score = Math.max(0, Math.log10(totalDepth + 1) * (1 - spread / 100) * 10);

      const metric: LiquidityMetric = {
        marketId,
        score: parseFloat(score.toFixed(2)),
        bidDepth: parseFloat(bidDepth.toFixed(2)),
        askDepth: parseFloat(askDepth.toFixed(2)),
        spread: parseFloat(spread.toFixed(4)),
        computedAt: new Date().toISOString(),
      };

      // Save to cache
      await this.saveMetric(metric);

      return metric;
    } catch (error) {
      console.error(`Error calculating liquidity for ${marketId}:`, error);
      return null;
    }
  }

  static async getMetric(marketId: string): Promise<LiquidityMetric | null> {
    // Try Redis cache first
    const cached = await CacheService.get<LiquidityMetric>(`liquidity:${marketId}`);
    if (cached) return cached;

    // Try database cache
    const metricsRepo = AppDataSource.getRepository(MetricsCache);
    const dbMetric = await metricsRepo.findOne({
      where: {
        marketId,
        metricType: 'liquidity',
      },
      order: { computedAt: 'DESC' },
    });

    if (dbMetric && dbMetric.expiresAt > new Date()) {
      const metric = dbMetric.value as LiquidityMetric;
      await CacheService.set(`liquidity:${marketId}`, metric, this.CACHE_TTL);
      return metric;
    }

    // Calculate fresh
    return this.calculate(marketId);
  }

  private static async saveMetric(metric: LiquidityMetric): Promise<void> {
    const metricsRepo = AppDataSource.getRepository(MetricsCache);
    const expiresAt = new Date(Date.now() + this.CACHE_TTL * 1000);

    await metricsRepo.save({
      key: `liquidity:${metric.marketId}`,
      marketId: metric.marketId,
      metricType: 'liquidity',
      value: metric,
      expiresAt,
    });

    await CacheService.set(`liquidity:${metric.marketId}`, metric, this.CACHE_TTL);
  }
}
