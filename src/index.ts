import 'reflect-metadata';
import { config } from 'dotenv';
import { initializeDatabase } from '@config/database';
import { InjectiveService } from '@config/injective';
import { createServer } from './server';
import { MarketIngestionService } from '@services/ingestion/MarketIngestion';
import { WhaleTracker } from '@services/analytics/WhaleTracker';

config();

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    console.log('🚀 Starting InjectiveQL...\n');

    // Initialize database
    await initializeDatabase();

    // Initialize Injective SDK
    InjectiveService.initialize();

    // Create Express server with Apollo GraphQL
    const app = await createServer();

    // Start background services
    MarketIngestionService.start();
    WhaleTracker.start();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`\n✅ Server ready:`);
      console.log(`   GraphQL: http://localhost:${PORT}/graphql`);
      console.log(`   REST API: http://localhost:${PORT}/api/v1`);
      console.log(`   Health: http://localhost:${PORT}/health\n`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n🛑 SIGTERM received, shutting down gracefully...');
      MarketIngestionService.stop();
      WhaleTracker.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('\n🛑 SIGINT received, shutting down gracefully...');
      MarketIngestionService.stop();
      WhaleTracker.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
