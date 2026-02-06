import { AppDataSource } from '@config/database';
import { WhaleActivity } from '@entities/WhaleActivity';
import { Market } from '@entities/Market';

export const whaleResolvers = {
  Query: {
    whaleActivity: async (
      _: any,
      { marketId, limit = 20 }: { marketId?: string; limit?: number }
    ) => {
      const whaleRepo = AppDataSource.getRepository(WhaleActivity);
      const query = whaleRepo.createQueryBuilder('whale');

      if (marketId) {
        query.where('whale.marketId = :marketId', { marketId });
      }

      const activities = await query
        .orderBy('whale.detectedAt', 'DESC')
        .take(limit)
        .getMany();

      return activities;
    },
  },

  WhaleEvent: {
    market: async (whale: WhaleActivity) => {
      const marketRepo = AppDataSource.getRepository(Market);
      return marketRepo.findOne({ where: { marketId: whale.marketId } });
    },
  },
};
