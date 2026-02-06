import { InjectiveService } from '@config/injective';
import { AppDataSource } from '@config/database';
import { MetricsCache } from '@entities/MetricsCache';
import { CacheService } from '@config/redis';

export interface VolatilityMetric {
  marketId: string;
  volatility1h: number | null;
  volatility24h: number | null;
  volatility7d: number | null;
  computedAt: string;
}

export class VolatilityCalculator {
  private static readonly CACHE_TTL = 300; // 5 minutes

  static async calculate(marketId: string): Promise<VolatilityMetric | null> {
    try {
      // Fetch recent trades
      const trades = await InjectiveService.getMarketTrades(marketId, true);

      if (!trades.trades || trades.trades.length < 10) {
        return null;
      }

      const now = Date.now();
      const oneHourAgo = now - 3600 * 1000;
      const oneDayAgo = now - 24 * 3600 * 1000;
      const oneWeekAgo = now - 7 * 24 * 3600 * 1000;

      const trades1h: number[] = [];
      const trades24h: number[] = [];
      const trades7d: number[] = [];

      for (const trade of trades.trades) {
        const timestamp = parseInt(String((trade as any).executedAt || '0'));
        const price = parseFloat((trade as any).price || '0');

        if (timestamp >= oneHourAgo) trades1h.push(price);
        if (timestamp >= oneDayAgo) trades24h.push(price);
        if (timestamp >= oneWeekAgo) trades7d.push(price);
      }

      const metric: VolatilityMetric = {
        marketId,
        volatility1h: this.calculateVolatility(trades1h),
        volatility24h: this.calculateVolatility(trades24h),
        volatility7d: this.calculateVolatility(trades7d),
        computedAt: new Date().toISOString(),
      };

      await this.saveMetric(metric);

      return metric;
    } catch (error) {
      console.error(`Error calculating volatility for ${marketId}:`, error);
      return null;
    }
  }

  private static calculateVolatility(prices: number[]): number | null {
    if (prices.length < 2) return null;

    // Calculate log returns
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }

    // Calculate standard deviation
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Annualize volatility (assuming 365 days, 24 hours)
    const annualizedVol = stdDev * Math.sqrt(365 * 24) * 100;

    return parseFloat(annualizedVol.toFixed(2));
  }

  static async getMetric(marketId: string): Promise<VolatilityMetric | null> {
    // Try Redis cache first
    const cached = await CacheService.get<VolatilityMetric>(`volatility:${marketId}`);
    if (cached) return cached;

    // Try database cache
    const metricsRepo = AppDataSource.getRepository(MetricsCache);
    const dbMetric = await metricsRepo.findOne({
      where: {
        marketId,
        metricType: 'volatility',
      },
      order: { computedAt: 'DESC' },
    });

    if (dbMetric && dbMetric.expiresAt > new Date()) {
      const metric = dbMetric.value as VolatilityMetric;
      await CacheService.set(`volatility:${marketId}`, metric, this.CACHE_TTL);
      return metric;
    }

    // Calculate fresh
    return this.calculate(marketId);
  }

  private static async saveMetric(metric: VolatilityMetric): Promise<void> {
    const metricsRepo = AppDataSource.getRepository(MetricsCache);
    const expiresAt = new Date(Date.now() + this.CACHE_TTL * 1000);

    await metricsRepo.save({
      key: `volatility:${metric.marketId}`,
      marketId: metric.marketId,
      metricType: 'volatility',
      value: metric,
      expiresAt,
    });

    await CacheService.set(`volatility:${metric.marketId}`, metric, this.CACHE_TTL);
  }
}
