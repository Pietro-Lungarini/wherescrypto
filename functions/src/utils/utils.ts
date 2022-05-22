import * as ffn from 'firebase-functions';
import { Exchange } from '../models/exchanges.model';
import { CryptoSignal } from '../models/crypto-signal.model';
import { User } from '../models/user.model';

// GLOBAL CONSTs
const CRYPTO_ALERTS_TG_ID = -1001309094154;
const FUTURES_SIGNALS_TG_ID = -1001309094154;

const CRYPTO_ALERTS_DB_NAME = 'crypto-alerts';
const FUTURES_SIGNALS_DB_NAME = 'futures-signals';
// END - GLOBAL CONSTs

export const isValidChatId = (chatId: number): boolean => {
	if (!chatId) return false;
	if (Math.abs(chatId) === Math.abs(CRYPTO_ALERTS_TG_ID)) return true;
	if (Math.abs(chatId) === Math.abs(FUTURES_SIGNALS_TG_ID)) return true;
	return false;
};

export const getSignalDbName = (chatId: number): string | undefined => {
	if (!chatId) return undefined;
	if (Math.abs(chatId) === Math.abs(CRYPTO_ALERTS_TG_ID)) {
		return CRYPTO_ALERTS_DB_NAME;
	}
	if (Math.abs(chatId) === Math.abs(FUTURES_SIGNALS_TG_ID)) {
		return FUTURES_SIGNALS_DB_NAME;
	}
	return undefined;
};

export const getExchange = (signal: CryptoSignal, user: User): Exchange => {
	const signalExchange = signal.setup?.exchanges;
	const supportedExs: Exchange[] = [];
	let canOpen = false;
	user.exchanges?.forEach((ex) => {
		const exs = signalExchange?.filter((item) => item === ex.id);
		canOpen = canOpen ? canOpen : exs?.length ? true : false;
		if (exs?.length) supportedExs.push(ex);
	});
	supportedExs.sort((a, b) => a.priority - b.priority);
	return supportedExs[0];
};

export const TG_IDS = {
	cryptoAlerts: CRYPTO_ALERTS_TG_ID,
	futuresSignals: FUTURES_SIGNALS_TG_ID,
};
export const DB_NAMES = {
	cryptoAlerts: CRYPTO_ALERTS_DB_NAME,
	futuresSignals: FUTURES_SIGNALS_DB_NAME,
};

export const logger = {
	error: (str: any, at?: string) => {
		if (!str) return;
		if (typeof str !== 'string') {
			str = JSON.stringify(str);
		}
		const msg = `[ERR] ${at ? '@ ' + at + ' ' : ''}=> ${str}`;
		ffn.logger.error(msg);
	},
	info: (str: any, at?: string) => {
		if (!str) return;
		if (typeof str !== 'string') {
			str = JSON.stringify(str);
		}
		const msg = `[LOG] ${at ? '@ ' + at + ' ' : ''}=> ${str}`;
		ffn.logger.info(msg);
	},
};
