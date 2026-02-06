// InjectiveHttpService - HTTP REST Fallback Implementation
// Use this to fetch market data when gRPC is blocked by firewall

import axios from 'axios';

interface Market {
  marketId: string;
  ticker: string;
  baseDenom: string;
  quoteDenom: string;
  baseSymbol?: string;
  quoteSymbol?: string;
  marketType: 'spot' | 'derivative';
  lastPrice: number | null;
  volume24h: number | null;
  change24h: number | null;
  high24h?: number | null;
  low24h?: number | null;
  makerFeeRate: number;
  takerFeeRate: number;
}

export class InjectiveHttpService {
  private static readonly INDEXER_API = process.env.INJECTIVE_INDEXER_HTTP || 
    'https://k8s.testnet.indexer.injective.network/api/explorer/v1';
  private static readonly TIMEOUT = 5000; // 5 second timeout

  /**
   * Fetch spot markets using HTTP REST instead of gRPC
   * This bypasses firewall issues with gRPC endpoints
   */
  static async getSpotMarkets(): Promise<Market[]> {
    try {
      console.log('📡 Fetching spot markets via HTTP REST API...');
      
      const response = await axios.get(`${this.INDEXER_API}/spot/markets`, {
        timeout: this.TIMEOUT,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.data || !response.data.data) {
        console.warn('⚠️  No market data in response');
        return [];
      }

      const markets: Market[] = response.data.data.map((m: any) => ({
        marketId: m.marketId || m.market_id,
        ticker: m.ticker,
        baseDenom: m.baseDenom || m.base_denom,
        quoteDenom: m.quoteDenom || m.quote_denom,
        baseSymbol: m.baseToken?.symbol || m.base_token?.symbol,
        quoteSymbol: m.quoteToken?.symbol || m.quote_token?.symbol,
        marketType: 'spot' as const,
        lastPrice: parseFloat(m.price || m.lastPrice || '0') || null,
        volume24h: parseFloat(m.volume || m.volume24h || '0') || null,
        change24h: parseFloat(m.change || m.change24h || '0') || null,
        high24h: parseFloat(m.high24h || '0') || null,
        low24h: parseFloat(m.low24h || '0') || null,
        makerFeeRate: parseFloat(m.makerFeeRate || m.maker_fee_rate || '0.001'),
        takerFeeRate: parseFloat(m.takerFeeRate || m.taker_fee_rate || '0.002'),
      }));

      console.log(`✅ Fetched ${markets.length} spot markets via HTTP`);
      return markets;

    } catch (error: any) {
      console.error('❌ HTTP fallback failed for spot markets:', error.message);
      
      // Check specific error types
      if (error.code === 'ECONNREFUSED') {
        console.error('💡 Network connectivity issue - check VPN/firewall');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('💡 Request timeout - Injective API may be slow');
      } else if (error.response) {
        console.error(`💡 HTTP ${error.response.status}: ${error.response.statusText}`);
      }
      
      return [];
    }
  }

  /**
   * Fetch derivative markets using HTTP REST
   */
  static async getDerivativeMarkets(): Promise<Market[]> {
    try {
      console.log('📡 Fetching derivative markets via HTTP REST API...');
      
      const response = await axios.get(`${this.INDEXER_API}/derivatives/markets`, {
        timeout: this.TIMEOUT,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.data || !response.data.data) {
        console.warn('⚠️  No derivative market data in response');
        return [];
      }

      const markets: Market[] = response.data.data.map((m: any) => ({
        marketId: m.marketId || m.market_id,
        ticker: m.ticker,
        baseDenom: m.quoteDenom || m.quote_denom || 'unknown',
        quoteDenom: m.quoteDenom || m.quote_denom || 'usdt',
        baseSymbol: m.quoteToken?.symbol || m.quote_token?.symbol,
        quoteSymbol: m.quoteToken?.symbol || m.quote_token?.symbol,
        marketType: 'derivative' as const,
        lastPrice: parseFloat(m.price || m.lastPrice || '0') || null,
        volume24h: parseFloat(m.volume || m.volume24h || '0') || null,
        change24h: parseFloat(m.change || m.change24h || '0') || null,
        high24h: parseFloat(m.high24h || '0') || null,
        low24h: parseFloat(m.low24h || '0') || null,
        makerFeeRate: parseFloat(m.makerFeeRate || m.maker_fee_rate || '0.0005'),
        takerFeeRate: parseFloat(m.takerFeeRate || m.taker_fee_rate || '0.0015'),
      }));

      console.log(`✅ Fetched ${markets.length} derivative markets via HTTP`);
      return markets;

    } catch (error: any) {
      console.error('❌ HTTP fallback failed for derivatives:', error.message);
      return [];
    }
  }

  /**
   * Fetch all markets (spot + derivative) with retry logic
   */
  static async getAllMarkets(retries = 2): Promise<Market[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${retries} to fetch markets...`);
        
        const [spotMarkets, derivativeMarkets] = await Promise.all([
          this.getSpotMarkets(),
          this.getDerivativeMarkets(),
        ]);

        const allMarkets = [...spotMarkets, ...derivativeMarkets];
        
        if (allMarkets.length > 0) {
          console.log(`✅ Successfully fetched ${allMarkets.length} total markets`);
          return allMarkets;
        }

        console.warn(`⚠️  Attempt ${attempt} returned 0 markets`);
        
        // Wait before retry
        if (attempt < retries) {
          console.log('⏳ Waiting 2s before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error: any) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          console.error('💡 All retry attempts failed. Keeping existing database data.');
          return [];
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return [];
  }

  /**
   * Test connectivity to Injective indexer
   */
  static async testConnectivity(): Promise<boolean> {
    try {
      console.log(`🔍 Testing connectivity to ${this.INDEXER_API}...`);
      
      const response = await axios.get(`${this.INDEXER_API}/spot/markets`, {
        timeout: 3000,
        params: { limit: 1 }, // Just need 1 market to test
      });
      
      console.log('✅ Injective indexer reachable via HTTP');
      return response.data && response.data.data;
      
    } catch (error: any) {
      console.error('❌ Injective indexer unreachable:', error.message);
      return false;
    }
  }
}

// Export convenience function
export async function fetchInjectiveMarkets(): Promise<Market[]> {
  // Test connectivity first
  const isReachable = await InjectiveHttpService.testConnectivity();
  
  if (!isReachable) {
    console.warn('⚠️  Injective API unreachable, keeping existing data');
    return [];
  }

  return InjectiveHttpService.getAllMarkets();
}
