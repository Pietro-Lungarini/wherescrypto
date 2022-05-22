export interface Exchange {
	apiKey: string;
	apiSecret: string;
	id: 'Binance' | 'KuCoin' | 'Huobi' | 'UniSwap' | 'MEXC' |
	'FTX' | 'Hoo.com' | 'Ascendex' | 'Bittrex' | 'Raydium' |
	'Gate.io' | 'Coinbase' | 'PancakeSwap' | 'Kraken';
	priority: number;
}
