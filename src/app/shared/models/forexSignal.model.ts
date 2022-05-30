import { ForexSymbols } from './forexSymbols.model';


export interface ForexSignal {
	side: 'buy' | 'sell';
	type: 'limit' | 'market' | 'stop' | 'stop-limit';
	symbol: ForexSymbols;
	lot: number;
	openPrice: number;
	stopLoss?: number | any;
	takeProfit?: number | any;
	marketOptions?: any;
	stopLimitOptions?: any;
	pendingOptions?: any;
}
