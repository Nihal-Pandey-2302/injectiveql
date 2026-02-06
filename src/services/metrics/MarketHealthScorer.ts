import { AppDataSource } from '@config/database';
import { MetricsCache } from '@entities/MetricsCache';
import { CacheService } from '@config/redis';
import { LiquidityCalculator } from './LiquidityCalculator';
import { VolatilityCalculator } from './VolatilityCalculator';
import { AppDataSource as db } from '@config/database';
import { Market } from '@entities/Market';

export interface HealthMetric {
  marketId: string;
  score: number;
  spreadScore: number;
  liquidityScore: number;
  volumeScore: number;
  status: 'healthy' | 'fair' | 'poor';
  computedAt: string;
}

export class MarketHealthScorer {
  private static readonly CACHE_TTL = 300; // 5 minutes

  static async calculate(marketId: string): Promise<HealthMetric | null> {
    try {
      // Get required metrics
      const liquidityMetric = await LiquidityCalculator.getMetric(marketId);
      const marketRepo = db.getRepository(Market);
      const market = await marketRepo.findOne({ where: { marketId } });

      if (!liquidityMetric || !market) {
        return null;
      }

      // 1. Spread Score (40% weight) - tighter is better
      // Target: <0.1% = 100, >1% = 0
      const spread = liquidityMetric.spread;
      const spreadScore = Math.max(0, Math.min(100, (1 - spread) * 100));

      // 2. Liquidity Score (30% weight) - already 0-10 scale
      const liquidityScore = liquidityMetric.score * 10; // Scale to 0-100

      // 3. Volume Score (30% weight)
      const volume24h = market.volume24h ? parseFloat(market.volume24h) : 0;
      // Logarithmic scale: $1M = 50, $10M = 75, $100M = 100
      const volumeScore = Math.min(100, Math.log10(volume24h + 1) * 12.5);

      // Weighted average
      const score = spreadScore * 0.4 + liquidityScore * 0.3 + volumeScore * 0.3;

      // Determine status
      let status: 'healthy' | 'fair' | 'poor';
      if (score >= 80) status = 'healthy';
      else if (score >= 50) status = 'fair';
      else status = 'poor';

      const metric: HealthMetric = {
        marketId,
        score: parseFloat(score.toFixed(2)),
        spreadScore: parseFloat(spreadScore.toFixed(2)),
        liquidityScore: parseFloat(liquidityScore.toFixed(2)),
        volumeScore: parseFloat(volumeScore.toFixed(2)),
        status,
        computedAt: new Date().toISOString(),
      };

      await this.saveMetric(metric);

      return metric;
    } catch (error) {
      console.error(`Error calculating health for ${marketId}:`, error);
      return null;
    }
  }

  static async getMetric(marketId: string): Promise<HealthMetric | null> {
    // Try Redis cache first
    const cached = await CacheService.get<HealthMetric>(`health:${marketId}`);
    if (cached) return cached;

    // Try database cache
    const metricsRepo = AppDataSource.getRepository(MetricsCache);
    const dbMetric = await metricsRepo.findOne({
      where: {
        marketId,
        metricType: 'health',
      },
      order: { computedAt: 'DESC' },
    });

    if (dbMetric && dbMetric.expiresAt > new Date()) {
      const metric = dbMetric.value as HealthMetric;
      await CacheService.set(`health:${marketId}`, metric, this.CACHE_TTL);
      return metric;
    }

    // Calculate fresh
    return this.calculate(marketId);
  }

  private static async saveMetric(metric: HealthMetric): Promise<void> {
    const metricsRepo = AppDataSource.getRepository(MetricsCache);
    const expiresAt = new Date(Date.now() + this.CACHE_TTL * 1000);

    await metricsRepo.save({
      key: `health:${metric.marketId}`,
      marketId: metric.marketId,
      metricType: 'health',
      value: metric,
      expiresAt,
    });

    await CacheService.set(`health:${metric.marketId}`, metric, this.CACHE_TTL);
  }
}
