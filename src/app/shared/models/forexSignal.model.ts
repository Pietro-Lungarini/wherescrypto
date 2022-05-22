import { CreateMarketTradeOptions, PendingTradeOptions, StopLimitPendingTradeOptions, StopOptions } from 'metaapi.cloud-sdk';
import { ForexSymbols } from './forexSymbols.model';


export interface ForexSignal {
	side: 'buy' | 'sell';
	type: 'limit' | 'market' | 'stop' | 'stop-limit';
	symbol: ForexSymbols;
	lot: number;
	openPrice: number;
	stopLoss?: number | StopOptions;
	takeProfit?: number | StopOptions;
	marketOptions?: CreateMarketTradeOptions;
	stopLimitOptions?: StopLimitPendingTradeOptions;
	pendingOptions?: PendingTradeOptions;
}
