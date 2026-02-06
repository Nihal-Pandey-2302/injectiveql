import { InjectiveService } from '@config/injective';
import { AppDataSource } from '@config/database';
import { Market } from '@entities/Market';

export class MarketIngestionService {
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;

  static async start() {
    if (this.isRunning) {
      console.log('⚠️  Market ingestion already running');
      return;
    }

    console.log('🚀 Starting market ingestion service...');
    this.isRunning = true;

    // Run immediately
    await this.ingestMarkets();

    // Run every 5 minutes
    this.intervalId = setInterval(() => {
      this.ingestMarkets();
    }, 5 * 60 * 1000);
  }

  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Market ingestion service stopped');
  }

  private static async ingestMarkets() {
    try {
      console.log('📊 Ingesting market data...');

      // Try HTTP REST fallback first (more reliable than gRPC)
      const { fetchInjectiveMarkets } = await import('@services/InjectiveHttpService');
      const markets = await fetchInjectiveMarkets();

      if (markets.length === 0) {
        console.warn('⚠️  No markets fetched from HTTP API, keeping existing data');
        
        // Still try gRPC as last resort
        console.log('🔄 Attempting gRPC fallback...');
        try {
          const spotMarkets = await InjectiveService.getSpotMarkets();
          const derivativeMarkets = await InjectiveService.getDerivativeMarkets();
          
          const spotList = Array.isArray(spotMarkets) ? spotMarkets : [];
          const derivList = Array.isArray(derivativeMarkets) ? derivativeMarkets : [];
          
          if (spotList.length === 0 && derivList.length === 0) {
            console.warn('⚠️  gRPC also returned no data. Database unchanged.');
            return;
          }
          
          // Process gRPC markets (existing code)
          await this.processGrpcMarkets(spotList, derivList);
          return;
          
        } catch (grpcError) {
          console.error('❌ gRPC fallback also failed:', (grpcError as Error).message);
          console.log('💡 Will retry in 5 minutes');
          return;
        }
      }

      // Process HTTP markets
      console.log(`✅ Processing ${markets.length} markets from HTTP...`);
      const marketRepo = AppDataSource.getRepository(Market);

      for (const market of markets) {
        // Find existing or create new
        let existingMarket = await marketRepo.findOne({ where: { marketId: market.marketId } });
        
        if (!existingMarket) {
          existingMarket = marketRepo.create({ marketId: market.marketId });
        }

        // Update fields
        existingMarket.ticker = market.ticker;
        existingMarket.marketType = market.marketType;
        existingMarket.baseDenom = market.baseDenom;
        existingMarket.quoteDenom = market.quoteDenom;
        existingMarket.baseSymbol = market.baseSymbol;
        existingMarket.quoteSymbol = market.quoteSymbol;
        existingMarket.makerFeeRate = market.makerFeeRate.toString();
        existingMarket.takerFeeRate = market.takerFeeRate.toString();
        existingMarket.lastPrice = market.lastPrice !== null ? market.lastPrice.toString() : undefined;
        existingMarket.volume24h = market.volume24h !== null ? market.volume24h.toString() : undefined;
        existingMarket.change24h = market.change24h !== null ? market.change24h.toString() : undefined;
        existingMarket.high24h = market.high24h ? market.high24h.toString() : undefined;
        existingMarket.low24h = market.low24h ? market.low24h.toString() : undefined;
        existingMarket.isActive = true;

        await marketRepo.save(existingMarket);
      }

      console.log(`✅ Successfully saved ${markets.length} markets to database`);
    } catch (error) {
      console.error('❌ Error ingesting markets:', (error as Error).message);
    }
  }

  // Helper method to process gRPC markets (keeping existing logic)
  private static async processGrpcMarkets(spotMarkets: any[], derivativeMarkets: any[]) {
    const marketRepo = AppDataSource.getRepository(Market);

    for (const market of spotMarkets) {
      await marketRepo.save({
        marketId: market.marketId,
        ticker: market.ticker,
        marketType: 'spot',
        baseDenom: market.baseDenom,
        quoteDenom: market.quoteDenom,
        baseSymbol: market.baseToken?.symbol,
        quoteSymbol: market.quoteToken?.symbol,
        makerFeeRate: market.makerFeeRate,
        takerFeeRate: market.takerFeeRate,
        lastPrice: (market as any).lastPrice,
        volume24h: (market as any).volume,
        change24h: (market as any).change,
        isActive: true,
      });
    }

    for (const market of derivativeMarkets) {
      await marketRepo.save({
        marketId: market.marketId,
        ticker: market.ticker,
        marketType: 'derivative',
        baseDenom: market.quoteDenom,
        quoteDenom: market.quoteDenom,
        baseSymbol: market.quoteToken?.symbol,
        quoteSymbol: market.quoteToken?.symbol,
        makerFeeRate: market.makerFeeRate,
        takerFeeRate: market.takerFeeRate,
        lastPrice: (market as any).lastPrice,
        volume24h: (market as any).volume,
        change24h: (market as any).change,
        isActive: true,
      });
    }

    console.log(`✅ Ingested ${spotMarkets.length + derivativeMarkets.length} markets via gRPC`);
  }
}
