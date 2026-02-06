export const typeDefs = `#graphql
  type Market {
    marketId: ID!
    ticker: String!
    marketType: String!
    baseDenom: String!
    quoteDenom: String!
    baseSymbol: String
    quoteSymbol: String
    price: Float
    volume24h: Float
    change24h: Float
    high24h: Float
    low24h: Float
    spread: Float
    liquidityScore: Float
    volatility1h: Float
    volatility24h: Float
    volatility7d: Float
    healthScore: Float
    isActive: Boolean!
    updatedAt: String!
  }

  type Orderbook {
    marketId: ID!
    bids: [OrderLevel!]!
    asks: [OrderLevel!]!
    timestamp: String!
  }

  type OrderLevel {
    price: Float!
    quantity: Float!
    total: Float!
  }

  type Trade {
    executedAt: String!
    price: Float!
    quantity: Float!
    fee: Float
    side: String!
    subaccountId: String
  }

  type Position {
    marketId: ID!
    subaccountId: String!
    direction: String!
    quantity: Float!
    entryPrice: Float!
    margin: Float!
    liquidationPrice: Float
    unrealizedPnl: Float
    leverage: Float!
  }

  type ArbitrageOpportunity {
    id: ID!
    marketPair: [String!]!
    spread: Float!
    potentialProfit: Float!
    buyMarket: Market!
    sellMarket: Market!
    timestamp: String!
  }

  type WhaleEvent {
    id: ID!
    marketId: ID!
    market: Market
    address: String!
    activityType: String!
    size: Float!
    usdValue: Float!
    price: Float
    side: String
    detectedAt: String!
  }

  type PortfolioSummary {
    totalValue: Float!
    totalPnl: Float!
    totalMargin: Float!
    positions: [Position!]!
    markets: [Market!]!
  }

  type LiquidityMetric {
    marketId: ID!
    score: Float!
    bidDepth: Float!
    askDepth: Float!
    spread: Float!
    computedAt: String!
  }

  type VolatilityMetric {
    marketId: ID!
    volatility1h: Float
    volatility24h: Float
    volatility7d: Float
    computedAt: String!
  }

  type HealthMetric {
    marketId: ID!
    score: Float!
    spreadScore: Float!
    liquidityScore: Float!
    volumeScore: Float!
    status: String!
    computedAt: String!
  }

  type Query {
    # Market queries
    market(marketId: ID!): Market
    markets(
      limit: Int = 20
      offset: Int = 0
      marketType: String
      search: String
    ): [Market!]!
    
    # Orderbook
    orderbook(marketId: ID!, levels: Int = 10): Orderbook!
    
    # Trades
    trades(marketId: ID!, limit: Int = 50): [Trade!]!
    
    # Analytics
    arbitrageOpportunities(minSpread: Float = 0.5, limit: Int = 10): [ArbitrageOpportunity!]!
    whaleActivity(marketId: ID, limit: Int = 20): [WhaleEvent!]!
    
    # Portfolio
    portfolio(addresses: [String!]!): PortfolioSummary!
    positions(address: String!): [Position!]!
    
    # Metrics
    liquidityMetrics(marketId: ID!): LiquidityMetric
    volatilityMetrics(marketId: ID!): VolatilityMetric
    healthMetrics(marketId: ID!): HealthMetric
  }

  type Subscription {
    priceUpdates(marketId: ID!): Market!
    newTrades(marketId: ID!): Trade!
    whaleAlerts(minUsdValue: Float = 100000): WhaleEvent!
  }
`;
