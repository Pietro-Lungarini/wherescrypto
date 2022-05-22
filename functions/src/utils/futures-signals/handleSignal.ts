import {
	CryptoSignal, CryptoSignalExchanges, CryptoSignalMargin, CryptoSignalSetup, CryptoSignalStopLoss, CryptoSignalTarget,
} from '../../models/crypto-signal.model';

const getPair = (msg: string) => {
	const a = msg.indexOf('\n\n📈 pair: ');
	const b = msg.indexOf('\n➡️ entry :');
	return msg.slice(a, b).replace('\n\n📈 pair: ', '').toUpperCase();
};

/* const getEntry = (msg: string): SignalEntry => {
	const res: SignalEntry = {};
	const chars = '\n➡️ entry :';
	const a = msg.indexOf(`${chars}`);
	const b = msg.indexOf('\n💎 take profit:');
	const entry = msg.slice(a, b).replace(`${chars}`, '');
	const side = entry.includes('buy') ? 'buy' : 'sell';
	const limitOrMarket = entry.includes('market') ? 'market' : entry.includes('@') ? 'limit' : undefined;
	const isMarket = limitOrMarket === 'market';
	res.currency = entry.includes('usdt') ? 'USDT' : entry.includes('btc') ? 'BTC' : undefined;
	res.price = !isMarket ?
		entry.replace(`${side} @ `, '').replace(` ${res.currency}`, '').trim() :
		entry.replace(`${side} market (`, '').replace(` ${res.currency})`, '').trim();
	return {
		orderType: !limitOrMarket ? undefined : `${side}-${limitOrMarket}`,
		...res,
	};
}; */

const getTakeProfit = (msg: string): CryptoSignalTarget => {
	const res: CryptoSignalTarget = {};
	const chars = '\n💎 take profit:';
	const a = msg.indexOf(`${chars}`);
	const b = msg.indexOf('\n🚨 stop loss');
	const tp = msg.slice(a, b).replace(`${chars}`, '');
	const tbd = tp.includes('tbd') ? true : false;
	if (tbd) return { tbd: true };

	res.currency = tp.includes('usdt') ?
		'USDT' :
		tp.includes('btc') ?
			'BTC' :
			undefined;
	res.price = tp.replace(res.currency || '', '').trim();

	return res;
};

const getStopLoss = (msg: string): CryptoSignalStopLoss => {
	const res: CryptoSignalStopLoss = {};
	const chars = '\n🚨 stop loss';
	const a = msg.indexOf(`${chars}`);
	const b = msg.indexOf('\n');
	const sl = msg.slice(a, b).replace(`${chars}`, '');
	const tbd = sl.includes('tbd') ? true : false;
	if (tbd) return { tbd: true, isValid: false };

	res.currency = sl.includes('usdt') ?
		'USDT' :
		sl.includes('btc') ?
			'BTC' :
			undefined;
	res.price = sl.replace(res.currency || '', '').trim();

	return { ...res, isValid: true };
};

const getMargin = (msg: string): CryptoSignalMargin => {
	const res: CryptoSignalMargin = {};
	const chars = '\n💰 margine';
	const a = msg.indexOf(`${chars}`);
	const b = msg.indexOf('\n');
	const margin = msg.slice(a, b).replace(`${chars}`, '');

	res.margin = parseFloat(margin.replace('x', '').trim());
	if (!res.margin) return { hasMargin: false };

	return { ...res, hasMargin: true };
};

const getExchanges = (msg: string): CryptoSignalExchanges => {
	const m = msg.slice(msg.indexOf('exchange: '));
	const exchanges: CryptoSignalExchanges = [
		'Binance',
		'KuCoin',
		'Huobi',
		'UniSwap',
		'MEXC',
		'FTX',
		'Hoo.com',
		'Ascendex',
		'Bittrex',
		'Raydium',
		'Gate.io',
		'Coinbase',
		'PancakeSwap',
		'Kraken',
	];
	const res: CryptoSignalExchanges = [];
	exchanges.forEach((ex) => {
		if (m.includes(ex.toLowerCase())) {
			res.push(ex);
		}
	});

	// TEMP
	res.push('KuCoin');

	return res;
};

const getSetup = (msg: string): CryptoSignalSetup => {
	const m = msg.toLowerCase();
	return {
		pair: getPair(m),
		targets: [getTakeProfit(m)],
		stopLoss: getStopLoss(m),
		margin: getMargin(m),
		exchanges: getExchanges(m),
	};
};

const getSignalType = (msg: string) => {
	const m = msg.toLowerCase();
	if (m.includes('#update')) return 'update';
	if (m.includes('#signal')) return 'signal';
	return undefined;
};

const getDesc = (msg: string) => {
	return msg.slice(msg.indexOf('👑\n')).trim();
};

export const handleSignal = (msg: string): CryptoSignal => {
	const signalType = getSignalType(msg);

	if (!signalType || signalType === 'update') {
		return { isValid: false, author: 'futures-signals' };
	}

	const m = msg.split('————————————');
	const notes = getDesc(m[0]);
	const setup = getSetup(m[1]);

	return { signalType, setup, notes, isValid: true, author: 'futures-signals' };
};
