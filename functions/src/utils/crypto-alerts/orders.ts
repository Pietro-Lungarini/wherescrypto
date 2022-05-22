import * as admin from 'firebase-admin';
import { BinanceExchange } from '../../exchanges/spot/binance';
import { CryptoSignal } from '../../models/crypto-signal.model';
import { User } from '../../models/user.model';
import { getExchange, logger } from '../utils';

// Elaborate order
export const openSignal = async (signal: CryptoSignal): Promise<any> => {
	if (!signal.isValid) return; // ERR

	if (!signal.signalType || signal.signalType === 'general-analysis') {
		return; // ERR
	}

	if (signal.signalType === 'update') {
		return; // Manage sell order
	}

	const users = await admin.firestore().collection('users').get();
	const res: any[] = [];

	await Promise.all(
		users.docs.map(async (u) => {
			const user = u.data() as User;
			// TODO: Perform checks for the user
			if (!user) return;
			const exchange = getExchange(signal, user);
			if (!exchange?.id) return logger.error(`Exchange is undefined ${user}`);
			if (exchange.id === 'Binance') {
				const binance = new BinanceExchange(
					exchange.apiKey,
					exchange.apiSecret,
				);
				const balanceRisk = user.preferences?.balanceRisk || 0.5;
				const order = await binance.buyOrder(signal, balanceRisk);

				if (order && order.orderId) {
					await admin
						.firestore()
						.doc(`users/${user.id}/orders/${order.orderId}`)
						.set(order, { merge: true });
				}

				res.push({ uid: user.id, order });
			}

			logger.info(`res is ${res}`);
		}),
	);

	return res;
};
