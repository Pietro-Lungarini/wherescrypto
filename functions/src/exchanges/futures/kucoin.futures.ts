import { CryptoSignal } from '../../models/crypto-signal.model';
import { logger } from './../../utils/utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const KuCoin = require('./kucoin-futures-node-api');

export class KucoinExchange {
	private kucoin = new KuCoin();

	constructor(
    private env: 'live' | 'demo',
    private apiKey: string,
    private apiSecret: string,
    private pass: string
	) {
		this.kucoin.init({
			environment: this.env,
			apiKey: this.apiKey,
			secretKey: this.apiSecret,
			passphrase: this.pass,
		});
	}

	async getBalance(currency: string): Promise<number> {
		try {
			currency = currency === 'USDT' ? 'USDT' : currency;
			const { data } = await this.kucoin.getAccountOverview({ currency });
			if (!data) throw new Error('[ERR] Data is undefined');
			return parseFloat(data.availableBalance);
		} catch (err) {
			logger.error(err);
			throw new Error('Error in Getting Balance');
		}
	}

	async buyOrder(signal: CryptoSignal, balanceRisk: number): Promise<any> {
		try {
			if (
				!this.kucoin ||
        !signal.setup?.pair ||
        !signal.setup.entry?.price ||
        balanceRisk > 0.8
			) {
				throw new Error('Check parameters');
			}

			const balance = await this.getBalance(signal.setup.currency || 'USDT');
			logger.info(`Balance ${balance}`);
			/* const entryPrice = parseFloat(signal.setup.entry.price);
			const investment = (balance * balanceRisk); */
			/* const qty = (investment / entryPrice); */

			//
		} catch (err) {
			logger.error(err);
			throw new Error('Buy order failed');
		}
	}

	/* private createOrder(signal: Signal): any {
		return {
			clientOid: this.createId(),

		};
	} */

	/* private createId(): string {
		return admin.firestore().collection('users').doc().id;
	} */
}
