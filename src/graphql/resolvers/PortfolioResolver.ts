import { InjectiveService } from '@config/injective';
import { AppDataSource } from '@config/database';
import { Market } from '@entities/Market';

export const portfolioResolvers = {
  Query: {
    positions: async (_: any, { address }: { address: string }) => {
      const response = await InjectiveService.getPositions(address);
      const positions = response.positions || [];
      
      return positions.map((p: any) => ({
        marketId: p.marketId,
        subaccountId: p.subaccountId,
        direction: p.direction,
        quantity: parseFloat(p.quantity),
        entryPrice: parseFloat(p.entryPrice),
        margin: parseFloat(p.margin),
        liquidationPrice: p.liquidationPrice ? parseFloat(p.liquidationPrice) : null,
        unrealizedPnl: p.unrealizedPnl ? parseFloat(p.unrealizedPnl) : 0,
        leverage: parseFloat(p.leverage),
      }));
    },

    portfolio: async (_: any, { addresses }: { addresses: string[] }) => {
      const marketRepo = AppDataSource.getRepository(Market);
      const allPositions = [];
      
      // Fetch positions for all addresses
      for (const address of addresses) {
        const response = await InjectiveService.getPositions(address);
        const positions = response.positions || [];
        allPositions.push(...positions);
      }

      // Calculate totals
      let totalValue = 0;
      let totalPnl = 0;
      let totalMargin = 0;
      const marketIds = new Set<string>();

      const formattedPositions = allPositions.map((p: any) => {
        const margin = parseFloat(p.margin);
        const pnl = p.unrealizedPnl ? parseFloat(p.unrealizedPnl) : 0;
        const value = margin + pnl;

        totalValue += value;
        totalPnl += pnl;
        totalMargin += margin;
        marketIds.add(p.marketId);

        return {
          marketId: p.marketId,
          subaccountId: p.subaccountId,
          direction: p.direction,
          quantity: parseFloat(p.quantity),
          entryPrice: parseFloat(p.entryPrice),
          margin,
          liquidationPrice: p.liquidationPrice ? parseFloat(p.liquidationPrice) : null,
          unrealizedPnl: pnl,
          leverage: parseFloat(p.leverage),
        };
      });

      // Fetch market details
      const markets = await marketRepo.findByIds(Array.from(marketIds));

      return {
        totalValue,
        totalPnl,
        totalMargin,
        positions: formattedPositions,
        markets,
      };
    },
  },
};
