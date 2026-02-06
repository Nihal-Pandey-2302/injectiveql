import { InjectiveService } from '@config/injective';
import { CacheService } from '@config/redis';

export const tradeResolvers = {
  Query: {
    trades: async (
      _: any,
      { marketId, limit = 50 }: { marketId: string; limit?: number }
    ) => {
      // Check cache
      const cacheKey = `trades:${marketId}:${limit}`;
      const cached = await CacheService.get<any[]>(cacheKey);
      if (cached) return cached;

      // Fetch from Injective
      const trades = await InjectiveService.getMarketTrades(marketId, true);

      const formattedTrades = trades.trades?.slice(0, limit).map((trade: any) => ({
        executedAt: new Date(parseInt(trade.executedAt)).toISOString(),
        price: parseFloat(trade.price),
        quantity: parseFloat(trade.quantity),
        fee: trade.fee ? parseFloat(trade.fee) : null,
        side: trade.tradeDirection,
        subaccountId: trade.subaccountId,
      })) || [];

      // Cache for 30 seconds
      await CacheService.set(cacheKey, formattedTrades, 30);

      return formattedTrades;
    },
  },
};
