import { AppDataSource } from '@config/database';
import { Market } from '@entities/Market';
import { CacheService } from '@config/redis';
import { LiquidityCalculator } from '@services/metrics/LiquidityCalculator';
import { VolatilityCalculator } from '@services/metrics/VolatilityCalculator';
import { MarketHealthScorer } from '@services/metrics/MarketHealthScorer';

export const marketResolvers = {
  Query: {
    market: async (_: any, { marketId }: { marketId: string }) => {
      const marketRepo = AppDataSource.getRepository(Market);
      const market = await marketRepo.findOne({ where: { marketId } });
      
      if (!market) {
        throw new Error(`Market ${marketId} not found`);
      }
      
      return market;
    },

    markets: async (
      _: any,
      {
        limit = 20,
        offset = 0,
        marketType,
        search,
      }: {
        limit?: number;
        offset?: number;
        marketType?: string;
        search?: string;
      }
    ) => {
      const marketRepo = AppDataSource.getRepository(Market);
      const query = marketRepo.createQueryBuilder('market').where('market.isActive = :isActive', { isActive: true });

      if (marketType) {
        query.andWhere('market.marketType = :marketType', { marketType });
      }

      if (search) {
        query.andWhere(
          '(market.ticker ILIKE :search OR market.baseSymbol ILIKE :search OR market.quoteSymbol ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      const markets = await query
        .orderBy('market.volume24h', 'DESC', 'NULLS LAST')
        .skip(offset)
        .take(limit)
        .getMany();

      return markets;
    },

    liquidityMetrics: async (_: any, { marketId }: { marketId: string }) => {
      const metric = await LiquidityCalculator.getMetric(marketId);
      return metric;
    },

    volatilityMetrics: async (_: any, { marketId }: { marketId: string }) => {
      const metric = await VolatilityCalculator.getMetric(marketId);
      return metric;
    },

    healthMetrics: async (_: any, { marketId }: { marketId: string }) => {
      const metric = await MarketHealthScorer.getMetric(marketId);
      return metric;
    },
  },

  Market: {
    // Map database lastPrice to GraphQL price field
    price: (market: Market) => {
      return market.lastPrice;
    },

    // Field resolvers for computed metrics
    liquidityScore: async (market: Market) => {
      const cached = await CacheService.get<number>(`liquidity:${market.marketId}`);
      if (cached !== null) return cached;
      
      const metric = await LiquidityCalculator.calculate(market.marketId);
      return metric?.score || null;
    },

    volatility1h: async (market: Market) => {
      const metric = await VolatilityCalculator.getMetric(market.marketId);
      return metric?.volatility1h || null;
    },

    volatility24h: async (market: Market) => {
      const metric = await VolatilityCalculator.getMetric(market.marketId);
      return metric?.volatility24h || null;
    },

    volatility7d: async (market: Market) => {
      const metric = await VolatilityCalculator.getMetric(market.marketId);
      return metric?.volatility7d || null;
    },

    healthScore: async (market: Market) => {
      const metric = await MarketHealthScorer.getMetric(market.marketId);
      return metric?.score || null;
    },

    spread: async (market: Market) => {
      const cached = await CacheService.get<{ spread: number }>(`orderbook:${market.marketId}`);
      return cached?.spread || null;
    },
  },
};
