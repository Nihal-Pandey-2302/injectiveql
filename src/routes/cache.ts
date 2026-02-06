import { Router, Request, Response } from 'express';
import { AppDataSource } from '@config/database';
import { Market } from '@entities/Market';

const router = Router();

// GET /api/v1/cache/markets
router.get('/markets', async (req: Request, res: Response) => {
  try {
    const marketRepo = AppDataSource.getRepository(Market);
    
    const markets = await marketRepo.find({
      where: { isActive: true },
      select: [
        'marketId',
        'ticker',
        'marketType',
        'baseSymbol',
        'quoteSymbol',
        'lastPrice',
        'volume24h',
        'change24h',
        'updatedAt',
      ],
      order: { volume24h: 'DESC' },
      cache: {
        id: 'markets_list',
        milliseconds: 5 * 60 * 1000, // 5 minutes
      },
    });

    res.json({
      count: markets.length,
      markets,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching cached markets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
