import { CreateMarketTradeOptions, PendingTradeOptions, StopLimitPendingTradeOptions, StopOptions } from 'metaapi.cloud-sdk';
import { ForexSymbols } from './forexSymbols.model';

export interface MTForexSignal {
	side: 'buy' | 'sell';
	type: 'limit' | 'market' | 'stop' | 'stop-limit';
	symbol: ForexSymbols;
	uid: string;
	signalId?: string;
	accountId: string;
	lot: number;
	openPrice: number;
	stopLoss?: number | StopOptions;
	stopLossPips: number;
	takeProfit?: number | StopOptions;
	marketOptions?: CreateMarketTradeOptions;
	stopLimitOptions?: StopLimitPendingTradeOptions;
	pendingOptions?: PendingTradeOptions;
	trailingStop: boolean;
	tps?: {
		tp1?: number | 'open';
		tp2?: number | 'open';
		tp3?: number | 'open';
		tp4?: number | 'open';
		tp5?: number | 'open';
	}
}
