# InjectiveQL Quick Start Guide

## Installation

### Option 1: Docker (Recommended)

**Prerequisites:**

- Docker 20.10+
- Docker Compose 2.0+

**Steps:**

```bash
# 1. Clone the repository
git clone <repository-url>
cd ninja-api

# 2. Create environment configuration
cp .env.example .env

# 3. (Optional) Edit .env for custom settings
nano .env

# 4. Start all services
docker-compose up -d

# 5. Check service health
curl http://localhost:4000/health

# 6. View logs
docker-compose logs -f api
```

**Verify Installation:**

- GraphQL Playground: http://localhost:4000/graphql
- Try a query: `{ markets(limit: 5) { ticker price } }`

### Option 2: Local Development

**Prerequisites:**

- Node.js 20+
- PostgreSQL 16
- Redis 7

**Steps:**

```bash
# 1. Install dependencies
npm install

# 2. Start databases (Docker)
docker-compose up -d postgres redis

# 3. Configure environment
cp .env.example .env
# Edit database connection settings

# 4. Run in development mode
npm run dev
```

## Configuration Guide

### Network Selection

```bash
# Mainnet (production data)
INJECTIVE_NETWORK=mainnet
INJECTIVE_RPC=https://k8s.mainnet.tm.injective.network:443
INJECTIVE_INDEXER=https://k8s.mainnet.indexer.injective.network

# Testnet (for development)
INJECTIVE_NETWORK=testnet
INJECTIVE_RPC=https://k8s.testnet.tm.injective.network:443
INJECTIVE_INDEXER=https://k8s.testnet.indexer.injective.network
```

### N1NJ4 NFT Integration

To enable N1NJ4 identity features:

```bash
# Set the NFT collection address
N1NJ4_CONTRACT=inj1... # Replace with actual contract

# Configure tier threshold
N1NJ4_PREMIUM_THRESHOLD=3 # NFTs needed for premium
```

**Testing N1NJ4 Verification:**

```bash
curl -X POST http://localhost:4000/api/v1/identity/verify \
  -H "Content-Type: application/json" \
  -d '{"address": "inj1youraddress"}'

# Response:
# {
#   "verified": true,
#   "tier": "premium",
#   "nftCount": 5,
#   "expiresAt": "2024-..."
# }
```

## API Usage Examples

### GraphQL Examples

#### 1. Basic Market Query

```graphql
query GetMarkets {
  markets(limit: 10, marketType: "spot") {
    marketId
    ticker
    price
    volume24h
    change24h
  }
}
```

#### 2. Market with Computed Metrics

```graphql
query MarketIntelligence {
  market(marketId: "0x...") {
    ticker
    price

    # Computed metrics
    liquidityScore
    volatility1h
    volatility24h
    volatility7d
    healthScore
    spread

    # Basic data
    volume24h
    change24h
  }
}
```

#### 3. Arbitrage Opportunities

```graphql
query FindArbitrage {
  arbitrageOpportunities(minSpread: 0.5, limit: 5) {
    marketPair
    spread
    potentialProfit

    buyMarket {
      ticker
      price
      makerFeeRate
    }

    sellMarket {
      ticker
      price
      takerFeeRate
    }

    timestamp
  }
}
```

#### 4. Whale Activity Monitoring

```graphql
query WhaleWatch {
  whaleActivity(marketId: "0x...", limit: 20) {
    activityType
    size
    usdValue
    price
    side
    detectedAt

    market {
      ticker
      marketType
    }
  }
}
```

#### 5. Portfolio Summary

```graphql
query MyPortfolio {
  portfolio(addresses: ["inj1address1", "inj1address2"]) {
    totalValue
    totalPnl
    totalMargin

    positions {
      marketId
      direction
      quantity
      entryPrice
      unrealizedPnl
      leverage
      liquidationPrice
    }

    markets {
      ticker
      price
    }
  }
}
```

### REST API Examples

#### Market Data Cache

```bash
# Get all cached markets (fast, 5min cache)
curl http://localhost:4000/api/v1/cache/markets

# Response includes count and cached timestamp
```

#### Liquidity Metrics

```bash
# Get liquidity depth score
curl "http://localhost:4000/api/v1/metrics/liquidity?marketId=0x..."

# Response:
# {
#   "marketId": "0x...",
#   "score": 7.5,
#   "bidDepth": 150000.50,
#   "askDepth": 148000.25,
#   "spread": 0.15,
#   "computedAt": "2024-..."
# }
```

#### Volatility Analysis

```bash
# All windows
curl "http://localhost:4000/api/v1/metrics/volatility?marketId=0x..."

# Specific window
curl "http://localhost:4000/api/v1/metrics/volatility?marketId=0x...&window=24h"

# Response:
# {
#   "marketId": "0x...",
#   "volatility": 45.2,
#   "computedAt": "2024-..."
# }
```

#### Market Health Score

```bash
curl "http://localhost:4000/api/v1/metrics/market-health?marketId=0x..."

# Response:
# {
#   "marketId": "0x...",
#   "score": 85.5,
#   "spreadScore": 90.0,
#   "liquidityScore": 82.0,
#   "volumeScore": 84.5,
#   "status": "healthy",
#   "computedAt": "2024-..."
# }
```

## Rate Limiting

Include your Injective address in requests for higher limits:

```bash
# Default: 100 req/hr
curl http://localhost:4000/api/v1/cache/markets

# With N1NJ4 verification (500-2000 req/hr)
curl http://localhost:4000/api/v1/cache/markets \
  -H "X-Injective-Address: inj1..."
```

Check rate limit headers in response:

```
X-RateLimit-Limit: 2000
X-RateLimit-Remaining: 1995
X-RateLimit-Reset: 1704067200
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis Connection Issues

```bash
# Test Redis connection
docker exec -it injectiveql-redis redis-cli ping
# Should return: PONG

# Clear Redis cache
docker exec -it injectiveql-redis redis-cli FLUSHALL
```

### API Not Starting

```bash
# Check all logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### No Market Data

```bash
# Market ingestion runs every 5 minutes
# Force run by restarting API
docker-compose restart api

# Check ingestion logs
docker-compose logs api | grep "Ingesting market data"
```

## Next Steps

1. **Explore GraphQL Playground**: http://localhost:4000/graphql
2. **Review Architecture**: See `docs/ARCHITECTURE.md`
3. **Check API Reference**: See `docs/openapi.yaml`
4. **Set up N1NJ4 Verification**: Configure your NFT contract
5. **Monitor Performance**: Use `/health` endpoint

## Support

For issues or questions:

- Check the logs: `docker-compose logs -f`
- Review documentation in `docs/`
- Open an issue on GitHub
