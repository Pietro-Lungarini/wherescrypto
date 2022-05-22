export interface ExchangeInput {
	id: 'Binance' | 'KuCoin' | 'Huobi' | 'UniSwap' | 'MEXC' |
	'FTX' | 'Hoo.com' | 'Ascendex' | 'Bittrex' | 'Raydium' |
	'Gate.io' | 'Coinbase' | 'PancakeSwap' | 'Kraken';
	logo?: string;
	priority?: number;
	available: boolean;
	details?: {
		apiKey: string;
		apiSecret: string;
	};
}
