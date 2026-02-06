import { AppDataSource } from '@config/database';
import { Market } from '@entities/Market';
import { InjectiveService } from '@config/injective';
import { CacheService } from '@config/redis';

export interface ArbitrageOpportunity {
  id: string;
  marketPair: string[];
  spread: number;
  potentialProfit: number;
  buyMarket: Market;
  sellMarket: Market;
  timestamp: string;
}

export class ArbitrageDetector {
  static async detectOpportunities(minSpread: number = 0.5, limit: number = 10): Promise<ArbitrageOpportunity[]> {
    // Check cache
    const cacheKey = `arbitrage:${minSpread}`;
    const cached = await CacheService.get<ArbitrageOpportunity[]>(cacheKey);
    if (cached) return cached.slice(0, limit);

    const marketRepo = AppDataSource.getRepository(Market);
    
    // Get all active markets grouped by base symbol
    const markets = await marketRepo.find({
      where: { isActive: true },
      order: { volume24h: 'DESC' },
    });

    // Group markets by base symbol
    const marketsByBase = new Map<string, Market[]>();
    
    for (const market of markets) {
      if (market.lastPrice && parseFloat(market.lastPrice) > 0) {
        const base = market.baseSymbol || market.baseDenom;
        if (!marketsByBase.has(base)) {
          marketsByBase.set(base, []);
        }
        marketsByBase.get(base)!.push(market);
      }
    }

    const opportunities: ArbitrageOpportunity[] = [];

    // Find arbitrage opportunities
    for (const [base, baseMarkets] of marketsByBase) {
      if (baseMarkets.length < 2) continue;

      for (let i = 0; i < baseMarkets.length; i++) {
        for (let j = i + 1; j < baseMarkets.length; j++) {
          const market1 = baseMarkets[i];
          const market2 = baseMarkets[j];

          const price1 = parseFloat(market1.lastPrice!);
          const price2 = parseFloat(market2.lastPrice!);

          // Calculate spread percentage
          const spread = Math.abs((price2 - price1) / price1) * 100;

          if (spread >= minSpread) {
            const [buyMarket, sellMarket] = price1 < price2 ? [market1, market2] : [market2, market1];
            const buyPrice = parseFloat(buyMarket.lastPrice!);
            const sellPrice = parseFloat(sellMarket.lastPrice!);

            // Calculate potential profit (accounting for fees)
            const buyFee = parseFloat(buyMarket.takerFeeRate);
            const sellFee = parseFloat(sellMarket.takerFeeRate);
            const potentialProfit = ((sellPrice - buyPrice) / buyPrice - buyFee - sellFee) * 100;

            opportunities.push({
              id: `${buyMarket.marketId}-${sellMarket.marketId}`,
              marketPair: [buyMarket.ticker, sellMarket.ticker],
              spread,
              potentialProfit,
              buyMarket,
              sellMarket,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }

    // Sort by potential profit
    opportunities.sort((a, b) => b.potentialProfit - a.potentialProfit);

    // Cache for 60 seconds
    await CacheService.set(cacheKey, opportunities, 60);

    return opportunities.slice(0, limit);
  }
}

export const arbitrageResolvers = {
  Query: {
    arbitrageOpportunities: async (
      _: any,
      { minSpread = 0.5, limit = 10 }: { minSpread?: number; limit?: number }
    ) => {
      return ArbitrageDetector.detectOpportunities(minSpread, limit);
    },
  },
};
