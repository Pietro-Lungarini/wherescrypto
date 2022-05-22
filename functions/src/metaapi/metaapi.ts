import { config as env } from 'firebase-functions';
import MetaApi, { RpcMetaApiConnection } from 'metaapi.cloud-sdk';
import { logger } from '../utils/utils';
import { ForexSignal } from './models/forexSignal.model';


const token = env().metaapi.token;
const api = new MetaApi(token);
const mtApi = api.metatraderAccountApi;


const getAccount = async (accountId: string) => {
	try {
		return await mtApi.getAccount(accountId);
	} catch (error) {
		logger.error(error, 'forexSignal > getAccount');
		return;
	}
};

const getConnection = async (accountId: string) => {
	const account = await getAccount(accountId);
	if (!account) return;
	try {
		const connection = account.getRPCConnection();
		await connection.connect();
		await connection.waitSynchronized();
		return connection;
	} catch (error) {
		logger.error(error, 'forexSignal > getConnection');
		return;
	}
};

const order = {
	buy: {
		market: async (c: RpcMetaApiConnection, s: ForexSignal ) => {
			return await c.createMarketBuyOrder(
				s.symbol[0], s.lot, s.stopLoss, s.takeProfit, s.marketOptions
			);
		},
		limit: async (c: RpcMetaApiConnection, s: ForexSignal) => {
			return await c.createLimitBuyOrder(
				s.symbol[0], s.lot, s.openPrice, s.stopLoss, s.takeProfit, s.pendingOptions
			);
		},
		stop: async (c: RpcMetaApiConnection, s: ForexSignal) => {
			return await c.createStopBuyOrder(
				s.symbol[0], s.lot, s.openPrice, s.stopLoss, s.takeProfit, s.pendingOptions
			);
		},
		stopLimit: async (c: RpcMetaApiConnection, s: ForexSignal) => {
			return await c.createStopLimitBuyOrder(
				s.symbol[0], s.lot, s.openPrice, s.stopLoss, s.takeProfit, s.stopLimitOptions
			);
		},
	},
	sell: {
		market: async (c: RpcMetaApiConnection, s: ForexSignal ) => {
			return await c.createMarketSellOrder(
				s.symbol[0], s.lot, s.stopLoss, s.takeProfit, s.marketOptions
			);
		},
		limit: async (c: RpcMetaApiConnection, s: ForexSignal) => {
			return await c.createLimitSellOrder(
				s.symbol[0], s.lot, s.openPrice, s.stopLoss, s.takeProfit, s.pendingOptions
			);
		},
		stop: async (c: RpcMetaApiConnection, s: ForexSignal) => {
			return await c.createStopSellOrder(
				s.symbol[0], s.lot, s.openPrice, s.stopLoss, s.takeProfit, s.pendingOptions
			);
		},
		stopLimit: async (c: RpcMetaApiConnection, s: ForexSignal) => {
			return await c.createStopLimitSellOrder(
				s.symbol[0], s.lot, s.openPrice, s.stopLoss, s.takeProfit, s.stopLimitOptions
			);
		},
	},
};

const elabSignal = async (id: string, signal: ForexSignal) => {
	const c = await getConnection(id);
	if (!c) return;

	const buy = order.buy;
	const sell = order.sell;
	let res;

	try {
		if (signal.side === 'buy') {
			switch (signal.type) {
			case 'market':
				res = await buy.market(c, signal);
				break;
			case 'limit':
				res = await buy.limit(c, signal);
				break;
			case 'stop':
				res = await buy.stop(c, signal);
				break;
			case 'stop-limit':
				res = await buy.stopLimit(c, signal);
				break;

			default:
				break;
			}
		} else {
			switch (signal.type) {
			case 'market':
				res = await sell.market(c, signal);
				break;
			case 'limit':
				res = await sell.limit(c, signal);
				break;
			case 'stop':
				res = await sell.stop(c, signal);
				break;
			case 'stop-limit':
				res = await sell.stopLimit(c, signal);
				break;

			default:
				break;
			}
		}
	} catch (error) {
		logger.error(error, 'forexSignal > elabSignal > order');
		return;
	}

	return res;
};


export const test = async (id: string, signal?: ForexSignal) => {
	if (!signal) return;
	return await elabSignal(id, signal);
};
