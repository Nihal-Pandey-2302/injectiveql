import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InjectiveQL REST API',
      version: '1.0.0',
      description: `
# InjectiveQL REST API Documentation

Developer-friendly REST endpoints for Injective Protocol data with pre-computed analytics.

## Features
- 🚀 **Fast**: Sub-100ms responses with intelligent caching
- 📊 **Smart**: Pre-computed volatility, liquidity, and health metrics  
- 🔐 **Secure**: N1NJ4 NFT-based rate limiting
- 🎯 **Easy**: Copy-paste examples that work immediately

## Quick Links
- **GraphQL Playground**: [/graphql](/graphql)
- **Health Check**: [/health](/health)
- **GitHub**: [ninja-api](https://github.com/yourusername/ninja-api)

## Authentication
Most endpoints are public. N1NJ4 NFT holders get higher rate limits:
- **Default**: 100 requests/hour
- **Standard** (1-2 NFTs): 500 requests/hour  
- **Premium** (3+ NFTs): 2000 requests/hour
      `,
      contact: {
        name: 'API Support',
        url: 'https://github.com/yourusername/ninja-api',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local development server',
      },
      {
        url: 'https://your-deployment.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Markets',
        description: 'Market data and metadata',
      },
      {
        name: 'Metrics',
        description: 'Pre-computed analytics (liquidity, volatility, health)',
      },
      {
        name: 'Identity',
        description: 'N1NJ4 NFT verification and rate limit tiers',
      },
      {
        name: 'Health',
        description: 'API health and status',
      },
    ],
    components: {
      schemas: {
        Market: {
          type: 'object',
          properties: {
            marketId: { type: 'string', example: '0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34' },
            ticker: { type: 'string', example: 'INJ/USDT' },lastPrice: { type: 'number', example: 38.45 },
            volume24h: { type: 'number', example: 15420000 },
            change24h: { type: 'number', example: 5.32 },
            high24h: { type: 'number', example: 39.12 },
            low24h: { type: 'number', example: 36.87 },
            marketType: { type: 'string', enum: ['spot', 'derivative'], example: 'spot' },
          },
        },
        MarketsResponse: {
          type: 'object',
          properties: {
            count: { type: 'integer', example: 42 },
            markets: {
              type: 'array',
              items: { $ref: '#/components/schemas/Market' },
            },
            cachedAt: { type: 'string', format: 'date-time', example: '2026-02-06T08:45:00Z' },
          },
        },
        LiquidityMetric: {
          type: 'object',
          properties: {
            marketId: { type: 'string' },
            score: { type: 'number', example: 85.5, description: '0-100 score based on orderbook depth' },
            bidDepth: { type: 'number', example: 450000, description: 'Total bid liquidity in USD' },
            askDepth: { type: 'number', example: 420000, description: 'Total ask liquidity in USD' },
            spread: { type: 'number', example: 0.15, description: 'Bid-ask spread %' },
            computedAt: { type: 'string', format: 'date-time' },
          },
        },
        VolatilityMetric: {
          type: 'object',
          properties: {
            marketId: { type: 'string' },
            volatility1h: { type: 'number', example: 12.4, description: 'Annualized volatility % (1 hour)' },
            volatility24h: { type: 'number', example: 45.6, description: 'Annualized volatility % (24 hours)' },
            volatility7d: { type: 'number', example: 62.8, description: 'Annualized volatility % (7 days)' },
            computedAt: { type: 'string', format: 'date-time' },
          },
        },
        HealthMetric: {
          type: 'object',
          properties: {
            marketId: { type: 'string' },
            score: { type: 'number', example: 82.7, description: 'Composite health score 0-100' },
            spreadScore: { type: 'number', example: 85 },
            liquidityScore: { type: 'number', example: 85.5 },
            volumeScore: { type: 'number', example: 78 },
            status: { type: 'string', enum: ['healthy', 'warning', 'critical'], example: 'healthy' },
            computedAt: { type: 'string', format: 'date-time' },
          },
        },
        IdentityVerification: {
          type: 'object',
          properties: {
            verified: { type: 'boolean', example: true },
            tier: { type: 'string', enum: ['default', 'standard', 'premium'], example: 'premium' },
            nftCount: { type: 'integer', example: 5 },
            expiresAt: { type: 'string', format: 'date-time', example: '2026-02-06T13:00:00Z' },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number', example: 3600 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Rate limit exceeded' },
            message: { type: 'string' },
          },
        },
      },
      responses: {
        RateLimitExceeded: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Rate limit exceeded' },
                  limit: { type: 'integer', example: 100 },
                  reset: { type: 'integer', example: 1770370200, description: 'Unix timestamp when limit resets' },
                },
              },
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'API health check',
          description: 'Returns API health status and uptime',
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' },
                  example: {
                    status: 'ok',
                    timestamp: '2026-02-06T08:45:00.000Z',
                    uptime: 3600,
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/cache/markets': {
        get: {
          tags: ['Markets'],
          summary: 'Get all cached markets',
          description: 'Retrieve all active markets from cache with basic metadata',
          responses: {
            '200': {
              description: 'List of cached markets',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MarketsResponse' },
                  example: {
                    count: 11,
                    markets: [
                      {
                        marketId: '0xperp9066bfa1bd97aad43dcff5e2914ffd88',
                        ticker: 'BTC/USDT PERP',
                        lastPrice: 67895,
                        volume24h: 195000000,
                        change24h: 1.93,
                        marketType: 'derivative',
                      },
                      {
                        marketId: '0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c',
                        ticker: 'INJ/USDT',
                        lastPrice: 38.45,
                        volume24h: 15420000,
                        change24h: 5.32,
                        marketType: 'spot',
                      },
                    ],
                    cachedAt: '2026-02-06T08:45:00.000Z',
                  },
                },
              },
            },
            '429': { $ref: '#/components/responses/RateLimitExceeded' },
          },
        },
      },
      '/api/v1/metrics/liquidity/{marketId}': {
        get: {
          tags: ['Metrics'],
          summary: 'Get liquidity metrics',
          description: 'Compute orderbook depth and liquidity score for a market',
          parameters: [
            {
              name: 'marketId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: '0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34',
              description: 'Injective market ID',
            },
          ],
          responses: {
            '200': {
              description: 'Liquidity metrics',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LiquidityMetric' },
                  example: {
                    marketId: '0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34',
                    score: 85.5,
                    bidDepth: 450000,
                    askDepth: 420000,
                    spread: 0.15,
                    computedAt: '2026-02-06T08:45:00.000Z',
                  },
                },
              },
            },
            '404': {
              description: 'Market not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '429': { $ref: '#/components/responses/RateLimitExceeded' },
          },
        },
      },
      '/api/v1/metrics/volatility/{marketId}': {
        get: {
          tags: ['Metrics'],
          summary: 'Get volatility metrics',
          description: 'Calculate annualized volatility across multiple timeframes',
          parameters: [
            {
              name: 'marketId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: '0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34',
            },
          ],
          responses: {
            '200': {
              description: 'Volatility metrics',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/VolatilityMetric' },
                  example: {
                    marketId: '0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34',
                    volatility1h: 12.4,
                    volatility24h: 45.6,
                    volatility7d: 62.8,
                    computedAt: '2026-02-06T08:45:00.000Z',
                  },
                },
              },
            },
            '429': { $ref: '#/components/responses/RateLimitExceeded' },
          },
        },
      },
      '/api/v1/metrics/health/{marketId}': {
        get: {
          tags: ['Metrics'],
          summary: 'Get market health score',
          description: 'Composite health metric combining spread, liquidity, and volume',
          parameters: [
            {
              name: 'marketId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: '0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34',
            },
          ],
          responses: {
            '200': {
              description: 'Market health metrics',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthMetric' },
                  example: {
                    marketId: '0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef5290daa3e522a34',
                    score: 82.7,
                    spreadScore: 85,
                    liquidityScore: 85.5,
                    volumeScore: 78,
                    status: 'healthy',
                    computedAt: '2026-02-06T08:45:00.000Z',
                  },
                },
              },
            },
            '429': { $ref: '#/components/responses/RateLimitExceeded' },
          },
        },
      },
      '/api/v1/identity/verify': {
        post: {
          tags: ['Identity'],
          summary: 'Verify N1NJ4 NFT ownership',
          description: 'Check if an address owns N1NJ4 NFTs and determine rate limit tier',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    address: {
                      type: 'string',
                      example: 'inj1...',
                      description: 'Injective wallet address',
                    },
                  },
                  required: ['address'],
                },
                example: {
                  address: 'inj1abc123def456...',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Verification result',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/IdentityVerification' },
                  examples: {
                    premium: {
                      summary: 'Premium tier (3+ NFTs)',
                      value: {
                        verified: true,
                        tier: 'premium',
                        nftCount: 5,
                        expiresAt: '2026-02-06T13:00:00.000Z',
                      },
                    },
                    standard: {
                      summary: 'Standard tier (1-2 NFTs)',
                      value: {
                        verified: true,
                        tier: 'standard',
                        nftCount: 2,
                        expiresAt: '2026-02-06T13:00:00.000Z',
                      },
                    },
                    default: {
                      summary: 'Default tier (no NFTs)',
                      value: {
                        verified: false,
                        tier: 'default',
                        nftCount: 0,
                        expiresAt: '2026-02-06T13:00:00.000Z',
                      },
                    },
                  },
                },
              },
            },
            '429': { $ref: '#/components/responses/RateLimitExceeded' },
          },
        },
      },
    },
  },
  apis: [], // We define everything inline above
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export function setupSwagger(app: Express): void {
  // Serve Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'InjectiveQL API Docs',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    })
  );

  // Serve Swagger JSON
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger UI available at: /api-docs');
}
