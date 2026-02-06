import { marketResolvers } from './MarketResolver';
import { orderbookResolvers } from './OrderbookResolver';
import { arbitrageResolvers } from './ArbitrageResolver';
import { whaleResolvers } from './WhaleResolver';
import { portfolioResolvers } from './PortfolioResolver';
import { tradeResolvers } from './TradeResolver';

export const resolvers = {
  Query: {
    ...marketResolvers.Query,
    ...orderbookResolvers.Query,
    ...arbitrageResolvers.Query,
    ...whaleResolvers.Query,
    ...portfolioResolvers.Query,
    ...tradeResolvers.Query,
  },
  Market: marketResolvers.Market,
  WhaleEvent: whaleResolvers.WhaleEvent,
};
