import { InjectiveService } from '@config/injective';
import { CacheService } from '@config/redis';

export interface OrderLevel {
  price: number;
  quantity: number;
  total: number;
}

export interface SimplifiedOrderbook {
  marketId: string;
  bids: OrderLevel[];
  asks: OrderLevel[];
  timestamp: string;
  spread?: number;
}

export const orderbookResolvers = {
  Query: {
    orderbook: async (
      _: any,
      { marketId, levels = 10 }: { marketId: string; levels?: number }
    ): Promise<SimplifiedOrderbook> => {
      // Check cache first
      const cacheKey = `orderbook:${marketId}:${levels}`;
      const cached = await CacheService.get<SimplifiedOrderbook>(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Fetch from Injective
      const orderbook = await InjectiveService.getMarketOrderbook(marketId, true);

      // Aggregate order levels
      const aggregateLevels = (orders: any[], limit: number): OrderLevel[] => {
        const levels: OrderLevel[] = [];
        let total = 0;

        for (let i = 0; i < Math.min(orders.length, limit); i++) {
          const order = orders[i];
          const price = parseFloat(order.price);
          const quantity = parseFloat(order.quantity);
          total += quantity;

          levels.push({
            price,
            quantity,
            total,
          });
        }

        return levels;
      };

      const bids = aggregateLevels(orderbook.buys || [], levels);
      const asks = aggregateLevels(orderbook.sells || [], levels);

      // Calculate spread
      const spread = bids.length > 0 && asks.length > 0
        ? ((asks[0].price - bids[0].price) / bids[0].price) * 100
        : undefined;

      const result: SimplifiedOrderbook = {
        marketId,
        bids,
        asks,
        timestamp: new Date().toISOString(),
        spread,
      };

      // Cache for 30 seconds
      await CacheService.set(cacheKey, result, 30);

      return result;
    },
  },
};
