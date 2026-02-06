import { Network } from '@injectivelabs/networks';
import { ChainGrpcWasmApi, IndexerGrpcSpotApi, IndexerGrpcDerivativesApi, IndexerRestExplorerApi } from '@injectivelabs/sdk-ts';
import { config } from 'dotenv';

config();

// Network configuration
const network = process.env.INJECTIVE_NETWORK === 'testnet' ? Network.Testnet : Network.Mainnet;

// Endpoint configuration
const endpoints = {
  rpc: process.env.INJECTIVE_RPC || 'https://k8s.mainnet.tm.injective.network:443',
  indexer: process.env.INJECTIVE_INDEXER || 'https://k8s.mainnet.indexer.injective.network',
};

// Initialize Injective SDK clients
export class InjectiveService {
  private static spotApi: IndexerGrpcSpotApi;
  private static derivativesApi: IndexerGrpcDerivativesApi;
  private static explorerApi: IndexerRestExplorerApi;
  private static wasmApi: ChainGrpcWasmApi;

  static initialize() {
    this.spotApi = new IndexerGrpcSpotApi(endpoints.indexer);
    this.derivativesApi = new IndexerGrpcDerivativesApi(endpoints.indexer);
    this.explorerApi = new IndexerRestExplorerApi(endpoints.indexer);
    this.wasmApi = new ChainGrpcWasmApi(endpoints.rpc);
    
    console.log(`✅ Injective SDK initialized (${network})`);
  }

  // Market data methods
  static async getSpotMarkets() {
    try {
      const markets = await this.spotApi.fetchMarkets();
      return markets;
    } catch (error) {
      console.error('Error fetching spot markets:', error);
      throw error;
    }
  }

  static async getDerivativeMarkets() {
    try {
      const markets = await this.derivativesApi.fetchMarkets();
      return markets;
    } catch (error) {
      console.error('Error fetching derivative markets:', error);
      throw error;
    }
  }

  static async getMarketOrderbook(marketId: string, isSpot: boolean = true) {
    try {
      const orderbook = isSpot 
        ? await this.spotApi.fetchOrderbookV2(marketId)
        : await this.derivativesApi.fetchOrderbookV2(marketId);
      return orderbook;
    } catch (error) {
      console.error(`Error fetching orderbook for ${marketId}:`, error);
      throw error;
    }
  }

  static async getMarketTrades(marketId: string, isSpot: boolean = true) {
    try {
      const trades = isSpot
        ? await this.spotApi.fetchTrades({ marketId })
        : await this.derivativesApi.fetchTrades({ marketId });
      return trades;
    } catch (error) {
      console.error(`Error fetching trades for ${marketId}:`, error);
      throw error;
    }
  }

  static async getPositions(subaccountId: string) {
    try {
      const positions = await this.derivativesApi.fetchPositions({
        subaccountId,
      });
      return positions;
    } catch (error) {
      console.error(`Error fetching positions for ${subaccountId}:`, error);
      throw error;
    }
  }

  // N1NJ4 NFT verification (CosmWasm query)
  static async queryNFTOwnership(contractAddress: string, address: string): Promise<any> {
    try {
      // Timeout after 2 seconds to prevent slow responses
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Verification timeout')), 2000)
      );

      const query = {
        tokens: {
          owner: address,
          limit: 30,
        },
      };
      
      const queryPromise = this.wasmApi.fetchSmartContractState(
        contractAddress,
        Buffer.from(JSON.stringify(query)).toString('base64')
      );

      // Race the query against timeout
      const response = await Promise.race([queryPromise, timeoutPromise]);
      return response;
    } catch (error) {
      console.warn(`N1NJ4 verification failed for ${address}, using graceful degradation:`, (error as Error).message);
      // Return empty result for graceful degradation
      return { data: Buffer.from(JSON.stringify({ tokens: [] })).toString('base64') };
    }
  }
}

export { network, endpoints };
