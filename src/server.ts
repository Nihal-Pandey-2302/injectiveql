import express, { Express } from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from '@graphql/schema';
import { resolvers } from '@graphql/resolvers';
import { errorHandler } from '@middleware/errorHandler';
import { RateLimiter } from '@middleware/rateLimiting';
import { setupSwagger } from '@config/swagger';

// REST routes
import cacheRoutes from '@routes/cache';
import metricsRoutes from '@routes/metrics';
import identityRoutes from '@routes/identity';

export async function createServer(): Promise<Express> {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Swagger Documentation (no rate limiting)
  setupSwagger(app);
  
  // Health check (no rate limiting)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Apply rate limiting to API routes
  app.use('/api', RateLimiter.middleware());
  app.use('/graphql', RateLimiter.middleware());

  // REST API routes
  app.use('/api/v1/cache', cacheRoutes);
  app.use('/api/v1/metrics', metricsRoutes);
  app.use('/api/v1/identity', identityRoutes);

  // GraphQL server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // Enable for GraphQL Playground
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return error;
    },
  });

  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        return {
          address: req.headers['x-injective-address'],
        };
      },
    })
  );

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
