import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Market } from '@entities/Market';
import { MetricsCache } from '@entities/MetricsCache';
import { WhaleActivity } from '@entities/WhaleActivity';
import { UserWatchlist } from '@entities/UserWatchlist';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  database: process.env.POSTGRES_DB || 'injectiveql',
  synchronize: process.env.NODE_ENV === 'development', // Auto-sync in dev only
  logging: process.env.NODE_ENV === 'development',
  entities: [Market, MetricsCache, WhaleActivity, UserWatchlist],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};
