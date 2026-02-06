import { InjectiveService } from '@config/injective';
import { AppDataSource } from '@config/database';
import { WhaleActivity } from '@entities/WhaleActivity';
import { Market } from '@entities/Market';

export class WhaleTracker {
  private static readonly WHALE_THRESHOLD_USD = 100000; // $100k
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;
  private static lastPositions = new Map<string, number>();

  static async start() {
    if (this.isRunning) {
      console.log('⚠️  Whale tracker already running');
      return;
    }

    console.log('🐋 Starting whale tracker...');
    this.isRunning = true;

    // Run every 2 minutes
    this.intervalId = setInterval(() => {
      this.trackWhaleActivity();
    }, 2 * 60 * 1000);
  }

  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Whale tracker stopped');
  }

  private static async trackWhaleActivity() {
    try {
      // This is a simplified implementation
      // In production, you'd monitor specific addresses or use event streams
      const marketRepo = AppDataSource.getRepository(Market);
      const whaleRepo = AppDataSource.getRepository(WhaleActivity);

      const markets = await marketRepo.find({
        where: { isActive: true, marketType: 'derivative' },
        take: 20, // Monitor top 20 markets
        order: { volume24h: 'DESC' },
      });

      for (const market of markets) {
        try {
          // Fetch recent trades
          const trades = await InjectiveService.getMarketTrades(market.marketId, false);

          for (const trade of trades.trades?.slice(0, 10) || []) {
            const price = parseFloat((trade as any).price || '0');
            const quantity = parseFloat((trade as any).quantity || '0');
            const usdValue = price * quantity;

            // Detect whale trades
            if (usdValue >= this.WHALE_THRESHOLD_USD) {
              await whaleRepo.save({
                marketId: market.marketId,
                address: trade.subaccountId || 'unknown',
                activityType: 'large_trade',
                size: quantity.toString(),
                usdValue: usdValue.toString(),
                price: price.toString(),
                side: trade.tradeDirection === 'buy' ? 'buy' : 'sell',
                metadata: {
                  tradeId: trade.orderHash,
                },
              });

              console.log(`🐋 Whale trade detected: $${usdValue.toFixed(0)} on ${market.ticker}`);
            }
          }
        } catch (error) {
          // Skip errors for individual markets
          continue;
        }
      }
    } catch (error) {
      console.error('❌ Error tracking whale activity:', error);
    }
  }
}
