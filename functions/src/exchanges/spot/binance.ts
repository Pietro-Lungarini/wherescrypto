import Binance, {
	Binance as BinanceType,
	NewOrderSpot,
	Order,
	OrderType,
	SymbolFilterType,
} from 'binance-api-node';
import { CryptoSignal } from '../../models/crypto-signal.model';
import { logger } from '../../utils/utils';

export class BinanceExchange {
	private binance: BinanceType;

	constructor(private apiKey: string, private apiSecret: string) {
		this.binance = Binance({
			apiKey: this.apiKey,
			apiSecret: this.apiSecret,
		});
	}

	async getBalance(coin: string): Promise<number> {
		coin = coin === 'USD' ? 'USDT' : coin;
		const info = await this.binance.accountInfo();
		const balance = info.balances.filter((item) => item.asset === coin);
		return parseFloat(balance[0].free);
	}

	async buyOrder(signal: CryptoSignal, balanceRisk: number): Promise<Order | void> {
		try {
			if (
				!this.binance ||
				!signal.setup?.pair ||
				!signal.setup.entry?.price ||
				balanceRisk > 0.8
			) {
				throw new Error('Check parameters');
			}

			const balance = await this.getBalance(signal.setup.currency || 'USDT');
			logger.info(`Balance ${balance}`);
			const entryPrice = parseFloat(signal.setup.entry.price);
			const investment = balance * balanceRisk;
			const qty = investment / entryPrice;

			const info = await this.binance.exchangeInfo();
			const symbol = info.symbols.filter((symbol) =>
				signal.setup?.pair?.includes(symbol.baseAsset + symbol.quoteAsset),
			);

			const countDecimals = (val: number) => {
				if (Math.floor(val) === val) return 0;
				return val.toString().split('.')[1].length || 0;
			};

			let normQty = qty;
			let canNotional = false;
			symbol[0].filters.forEach((filter) => {
				if (filter.filterType === SymbolFilterType.LOT_SIZE) {
					const stepSize = parseFloat(filter.stepSize);
					const stepIndex = 1 / stepSize;
					const stepDecimals = countDecimals(stepSize);
					const lessThanOne = Math.round(qty * stepIndex) / stepIndex;
					if (stepSize > 1) normQty = parseFloat((qty / stepSize).toFixed());
					if (stepSize === 1) normQty = parseFloat(qty.toFixed());
					if (stepSize < 1) {
						normQty = parseFloat(lessThanOne.toFixed(stepDecimals));
					}
				}

				if (filter.filterType === SymbolFilterType.MIN_NOTIONAL) {
					const minNotional = parseFloat(filter.notional);
					const res = entryPrice * normQty;
					canNotional = res > minNotional;
				}

				// DEBUG: ffn.logger.log('Filter', filter);
			});

			if (!canNotional) {
				throw new Error('Not enough founds');
			}

			const order = {
				symbol: signal.setup?.pair,
				side: 'BUY',
				quantity: normQty + '',
				price: entryPrice + '',
				type: OrderType.LIMIT,
			} as NewOrderSpot;

			return await this.binance.order(order);
		} catch (error) {
			logger.error(error);
		}
	}
}
