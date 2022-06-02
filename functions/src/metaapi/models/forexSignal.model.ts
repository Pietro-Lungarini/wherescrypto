import { CreateMarketTradeOptions, PendingTradeOptions, StopLimitPendingTradeOptions, StopOptions } from 'metaapi.cloud-sdk';
import { ForexSymbols } from './forexSymbols.model';

export interface MTForexSignal {
	channel: "binaryAlpha" | "binaryOmega" | "binaryDelta" | "cryptoAlerts" | "fxLegacy" | "fxResistance" | "fxIota" | "fxLds" | "commoditiesAlpha" | "commoditiesGamma" | "wheresbebo";
	actions?: ("cancel" | "close-all" | "partial-close" | "signal-update" | "break-even" | "move-sl" | "new")[];
	actionOptions?: {
    closeQty?: number;
    moveSl?: 'entry' | 'tp' | 'tp1' | 'tp2' | 'tp3' | 'tp4' | 'tp5' | number;
  };
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
