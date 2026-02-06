import { Router, Request, Response } from 'express';
import { LiquidityCalculator } from '@services/metrics/LiquidityCalculator';
import { VolatilityCalculator } from '@services/metrics/VolatilityCalculator';
import { MarketHealthScorer } from '@services/metrics/MarketHealthScorer';

const router = Router();

// GET /api/v1/metrics/liquidity?marketId=0x...
router.get('/liquidity', async (req: Request, res: Response) => {
  try {
    const { marketId } = req.query;

    if (!marketId || typeof marketId !== 'string') {
      return res.status(400).json({ error: 'Market ID is required' });
    }

    const metric = await LiquidityCalculator.getMetric(marketId);

    if (!metric) {
      return res.status(404).json({ error: 'Metric not found or could not be calculated' });
    }

    res.json(metric);
  } catch (error) {
    console.error('Error fetching liquidity metric:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/metrics/volatility?marketId=0x...&window=24h
router.get('/volatility', async (req: Request, res: Response) => {
  try {
    const { marketId, window = '24h' } = req.query;

    if (!marketId || typeof marketId !== 'string') {
      return res.status(400).json({ error: 'Market ID is required' });
    }

    const metric = await VolatilityCalculator.getMetric(marketId);

    if (!metric) {
      return res.status(404).json({ error: 'Metric not found or could not be calculated' });
    }

    // Return specific window if requested
    let result: any = metric;
    if (window === '1h') {
      result = { marketId, volatility: metric.volatility1h, computedAt: metric.computedAt };
    } else if (window === '24h') {
      result = { marketId, volatility: metric.volatility24h, computedAt: metric.computedAt };
    } else if (window === '7d') {
      result = { marketId, volatility: metric.volatility7d, computedAt: metric.computedAt };
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching volatility metric:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/metrics/market-health?marketId=0x...
router.get('/market-health', async (req: Request, res: Response) => {
  try {
    const { marketId } = req.query;

    if (!marketId || typeof marketId !== 'string') {
      return res.status(400).json({ error: 'Market ID is required' });
    }

    const metric = await MarketHealthScorer.getMetric(marketId);

    if (!metric) {
      return res.status(404).json({ error: 'Metric not found or could not be calculated' });
    }

    res.json(metric);
  } catch (error) {
    console.error('Error fetching health metric:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
