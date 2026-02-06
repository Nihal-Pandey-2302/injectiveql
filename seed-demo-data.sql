-- InjectiveQL Demo Data Seeding Script
-- Provides realistic market data for testing and screenshots

-- Clear existing data
TRUNCATE TABLE markets CASCADE;
TRUNCATE TABLE whale_activity CASCADE;
TRUNCATE TABLE metrics_cache CASCADE;

-- Seed Spot Markets
INSERT INTO markets (
  "marketId", ticker, "marketType", "baseDenom", "quoteDenom", 
  "baseSymbol", "quoteSymbol", "makerFeeRate", "takerFeeRate",
  "lastPrice", "volume24h", "change24h", "high24h", "low24h", "isActive"
) VALUES
  -- Major pairs
  ('0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34', 'INJ/USDT', 'spot', 'inj', 'peggy0xdAC17', 'INJ', 'USDT', 0.001, 0.002, 38.45, 15420000, 5.32, 39.12, 36.87, true),
  ('0x54d4aeb3a5e4097832d40132b3ae4c2934fcb5a29c6cc2', 'ETH/USDT', 'spot', 'peggy0xC02a', 'peggy0xdAC17', 'ETH', 'USDT', 0.001, 0.002, 3245.67, 45200000, 2.15, 3298.50, 3187.20, true),
  ('0x9066bfa1bd97aad43dcff5e2914ffd88db5227', 'BTC/USDT', 'spot', 'peggy0x2260', 'peggy0xdAC17', 'BTC', 'USDT', 0.001, 0.002, 67840.25, 128500000, 1.85, 68500.00, 66200.00, true),
  ('0x1c79dac019f73e4060494ab1b4fcba734350656d', 'ATOM/USDT', 'spot', 'ibc/C4CFF4', 'peggy0xdAC17', 'ATOM', 'USDT', 0.001, 0.002, 9.87, 3240000, -1.24, 10.12, 9.65, true),
  ('0xa508cb32923323679f29a032c70342c147c17d0c', 'OSMO/USDT', 'spot', 'ibc/92E0120', 'peggy0xdAC17', 'OSMO', 'USDT', 0.001, 0.002, 0.856, 890000, 3.47, 0.891, 0.823, true),
  
  -- Additional trading pairs
  ('0xab313bb0dc4157676050e798605ba0fc', 'SOL/USDT', 'spot', 'sol', 'peggy0xdAC17', 'SOL', 'USDT', 0.001, 0.002, 143.25, 28900000, 6.12, 148.30, 138.50, true),
  ('0xcd87c0d62f5c5f4f9c79a8f23b45aa', 'ARB/USDT', 'spot', 'arb', 'peggy0xdAC17', 'ARB', 'USDT', 0.001, 0.002, 1.87, 5420000, 8.76, 1.98, 1.72, true),
  ('0xef12ab34cd56789012345678901234', 'AVAX/USDT', 'spot', 'avax', 'peggy0xdAC17', 'AVAX', 'USDT', 0.001, 0.002, 42.15, 7650000, -2.34, 43.50, 41.20, true)
;

-- Seed Derivative Markets (Perpetuals)
INSERT INTO markets (
  "marketId", ticker, "marketType", "baseDenom", "quoteDenom",
  "baseSymbol", "quoteSymbol", "makerFeeRate", "takerFeeRate",
  "lastPrice", "volume24h", "change24h", "high24h", "low24h", "isActive"
) VALUES
  ('0xperp0511ddc4e6586f3bfe1acb2dd905f8b8a82c', 'INJ/USDT PERP', 'derivative', 'inj', 'peggy0xdAC17', 'INJ', 'USDT', 0.0005, 0.0015, 38.52, 24800000, 5.45, 39.20, 36.95, true),
  ('0xperp54d4aeb3a5e4097832d40132b3ae4c29', 'ETH/USDT PERP', 'derivative', 'peggy0xC02a', 'peggy0xdAC17', 'ETH', 'USDT', 0.0005, 0.0015, 3248.30, 67500000, 2.28, 3302.00, 3190.50, true),
  ('0xperp9066bfa1bd97aad43dcff5e2914ffd88', 'BTC/USDT PERP', 'derivative', 'peggy0x2260', 'peggy0xdAC17', 'BTC', 'USDT', 0.0005, 0.0015, 67895.00, 195000000, 1.93, 68600.00, 66300.00, true)
;

-- Seed Whale Activity Events
INSERT INTO whale_activity (
  "marketId", address, "activityType", size, "usdValue", price, side, "detectedAt"
) VALUES
  ('0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34', 'inj1whale1xxxxxxxxxxxxxxxxxx', 'large_trade', 3500, 134575, 38.45, 'buy', NOW() - INTERVAL '15 minutes'),
  ('0x54d4aeb3a5e4097832d40132b3ae4c2934fcb5a29c6cc2', 'inj1whale2xxxxxxxxxxxxxxxxxx', 'large_trade', 42, 136318.14, 3245.67, 'sell', NOW() - INTERVAL '1 hour'),
  ('0x9066bfa1bd97aad43dcff5e2914ffd88db5227', 'inj1whale3xxxxxxxxxxxxxxxxxx', 'large_trade', 2.5, 169600.625, 67840.25, 'buy', NOW() - INTERVAL '2 hours'),
  ('0xperp0511ddc4e6586f3bfe1acb2dd905f8b8a82c', 'inj1whale4xxxxxxxxxxxxxxxxxx', 'large_position', 5800, 223416, 38.52, 'long', NOW() - INTERVAL '3 hours'),
  ('0xperp54d4aeb3a5e4097832d40132b3ae4c29', 'inj1whale5xxxxxxxxxxxxxxxxxx', 'large_trade', 38, 123435.4, 3248.30, 'buy', NOW() - INTERVAL '5 hours'),
  ('0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34', 'inj1whale6xxxxxxxxxxxxxxxxxx', 'large_trade', 2800, 107660, 38.45, 'sell', NOW() - INTERVAL '8 hours'),
  ('0xperp9066bfa1bd97aad43dcff5e2914ffd88', 'inj1whale7xxxxxxxxxxxxxxxxxx', 'large_position', 1.8, 122211, 67895.00, 'short', NOW() - INTERVAL '12 hours')
;

-- Seed Metrics Cache (pre-computed analytics)
INSERT INTO metrics_cache (
  key, "marketId", "metricType", value, "expiresAt"
) VALUES
  -- Liquidity scores
  ('liquidity:0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34', 
   '0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34', 
   'liquidity', 
   '{"score": 85.5, "bidDepth": 450000, "askDepth": 420000, "spread": 0.15}',
   NOW() + INTERVAL '5 minutes'),
  
  ('liquidity:0x54d4aeb3a5e4097832d40132b3ae4c2934fcb5a29c6cc2',
   '0x54d4aeb3a5e4097832d40132b3ae4c2934fcb5a29c6cc2',
   'liquidity',
   '{"score": 92.3, "bidDepth": 1200000, "askDepth": 1150000, "spread": 0.08}',
   NOW() + INTERVAL '5 minutes'),
   
  ('liquidity:0x9066bfa1bd97aad43dcff5e2914ffd88db5227',
   '0x9066bfa1bd97aad43dcff5e2914ffd88db5227',
   'liquidity',
   '{"score": 95.8, "bidDepth": 2800000, "askDepth": 2750000, "spread": 0.05}',
   NOW() + INTERVAL '5 minutes'),
   
  -- Volatility metrics
  ('volatility:0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34',
   '0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34',
   'volatility',
   '{"volatility1h": 12.4, "volatility24h": 45.6, "volatility7d": 62.8}',
   NOW() + INTERVAL '5 minutes'),
   
  ('volatility:0x54d4aeb3a5e4097832d40132b3ae4c2934fcb5a29c6cc2',
   '0x54d4aeb3a5e4097832d40132b3ae4c2934fcb5a29c6cc2',
   'volatility',
   '{"volatility1h": 8.2, "volatility24h": 35.4, "volatility7d": 51.2}',
   NOW() + INTERVAL '5 minutes'),
   
  -- Health scores
  ('health:0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34',
   '0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34',
   'health',
   '{"score": 82.7, "spreadScore": 85, "liquidityScore": 85.5, "volumeScore": 78}',
   NOW() + INTERVAL '5 minutes'),
   
  ('health:0x54d4aeb3a5e4097832d40132b3ae4c2934fcb5a29c6cc2',
   '0x54d4aeb3a5e4097832d40132b3ae4c2934fcb5a29c6cc2',
   'health',
   '{"score": 88.4, "spreadScore": 92, "liquidityScore": 92.3, "volumeScore": 81}',
   NOW() + INTERVAL '5 minutes')
;

-- Verify data
SELECT 'Markets seeded:' as info, COUNT(*) as count FROM markets;
SELECT 'Whale events seeded:' as info, COUNT(*) as count FROM whale_activity;
SELECT 'Metrics cached:' as info, COUNT(*) as count FROM metrics_cache;

SELECT '✅ Demo data seeded successfully! Run ./test-api.sh to verify.' as status;
