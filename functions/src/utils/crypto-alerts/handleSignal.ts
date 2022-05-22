/* eslint-disable no-mixed-spaces-and-tabs */
import {
	CryptoSignal, CryptoSignalEntry, CryptoSignalExchanges, CryptoSignalSetup, CryptoSignalStopLoss, CryptoSignalTarget,
} from '../../models/crypto-signal.model';

const getPair = (msg: string) => {
	const a = msg.indexOf('\n\n📈 pair: ');
	const b = msg.indexOf('\n➡️entry :');
	return msg.slice(a, b).replace('\n\n📈 pair: ', '').toUpperCase();
};

const getEntry = (msg: string, aStr: string, bStr: string): CryptoSignalEntry => {
	const res: CryptoSignalEntry = {};
	const chars = '\n➡️';
	const a = msg.indexOf(`${chars}${aStr}`);
	const b = msg.indexOf(`${chars}${bStr}`);
	const entry = msg.slice(a, b).replace(`${chars}${aStr}`, '');
	res.currency = entry.includes('usd') ?
		'USD' :
		entry.includes('btc') ?
			'BTC' :
			undefined;
	res.price = entry
		.replace(`buy limit - ${(res.currency || 'USD').toLowerCase()} `, '')
		.replace('\n', '');
	return {
		orderType: 'buy-limit',
		...res,
	};
};

const getTargets = (
	msg: string,
	isShad: boolean
): CryptoSignalTarget[] | undefined => {
	const shadIndex = msg.indexOf('\n\nshad targets: \n');
	if (isShad && !shadIndex) return;
	const m = msg.slice(isShad ? shadIndex : 0, isShad ? msg.length : shadIndex);
	const targets: CryptoSignalTarget[] = [];
	const getTarget = (str: string, id: number): CryptoSignalTarget => {
		if (str.includes('to be defined')) return { tbd: true };
		const currency = str.includes('usd') ?
			'USD' :
			str.includes('btc') ?
				'BTC' :
				undefined;
		const a = str.indexOf(currency?.toLowerCase() || '');
		const b =
      str.indexOf('- 50% of the position') !== -1 ?
      	str.indexOf('- 50% of the position') :
      	str.indexOf('- 100% of the position');
		const price = str
			.slice(a, b)
			.replace(currency?.toLowerCase() + ' ', '')
			.trim();
		const quantity = str.includes('50%') ?
			0.5 :
			str.includes('100%') ?
				1 :
				undefined;
		return { id, currency, price, quantity, tbd: false };
	};
	m.split('🎯target ').forEach((val, i) => {
		if (!i) return;
		if (val.includes('final target')) {
			val.split('🎯final target :').forEach((str, ix) => {
				const target = getTarget(str, ix + i);
				targets.push(target);
			});
			return;
		}
		const target = getTarget(val, i);
		targets.push(target);
	});
	return targets;
};

const getStopLoss = (msg: string): CryptoSignalStopLoss => {
	const a = msg.indexOf('✅stop loss: ');
	const b =
    msg.indexOf('\n⚖️risk reward') === -1 ?
    	msg.indexOf('\n⭕️risk:') :
    	msg.indexOf('\n⚖️risk reward');
	const m = msg.slice(a, b).replace('✅stop loss: ', '');
	if (m.includes('none')) return { isValid: false };

	const currency = m.includes('btc') ?
		'BTC' :
		m.includes('usd') ?
			'USD' :
			m.includes('usdt') ?
				'USDT' :
				undefined;
	const price = m.replace((currency || '').toLowerCase(), '').trim();
	return { currency, price, isValid: true };
};

const getRisk = (msg: string): number | undefined => {
	const a = msg.indexOf('⭕️risk: ');
	const b = msg.indexOf('🖥recommended position: ');
	const m = msg.slice(a, b).replace('⭕️risk: ', '');
	return m.includes('high') ?
		3 :
		m.includes('medium') ?
			2 :
			m.includes('low') ?
				1 :
				undefined;
};

const getPositionQuantity = (msg: string): number => {
	const a = msg.indexOf('recommended position: ');
	const b = msg.indexOf('of position');
	const m = msg.slice(a, b).replace('recommended position: ', '');
	const quantity = 1 / parseInt(m.replace('1/', ''));

	return quantity;
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
	return res;
};

const getSetup = (msg: string): CryptoSignalSetup => {
	const m = msg.toLowerCase();
	return {
		pair: getPair(m),
		entry: getEntry(m, 'entry :', 'safe entry :'),
		safeEntry: getEntry(m, 'safe entry : ', 'agressive entry : '),
		aggressiveEntry: {
			orderType: 'buy-market',
		},
		targets: getTargets(m, false),
		shadTargets: getTargets(m, true),
		position: getPositionQuantity(m),
		stopLoss: getStopLoss(m),
		risk: getRisk(m),
		exchanges: getExchanges(m),
	};
};

const getSignalType = (msg: string) => {
	const m = msg.slice(0, 100).toLowerCase();
	if (m.includes('update')) return 'update';
	if (m.includes('investment') && m.includes('1/')) return 'investment';
	if (m.includes('ma investment') && m.includes('1/')) return 'ma-investment';
	if (m.includes('shad roi strategy') && m.includes('1/')) {
		return 'shad-strategy';
	}
	if (m.includes('mt trading') && m.includes('1/')) return 'mt-trading';
	if (m.includes('general market analysis') && m.includes('1/')) {
		return 'general-analysis';
	}
	return undefined;
};

export const handleSignal = (msg: string): CryptoSignal => {
	const signalType = getSignalType(msg);

	if (!signalType || signalType === 'general-analysis') {
		return { isValid: false, author: 'crypto-alerts' };
	}

	const m = msg.split('—————————————')[0];
	const setup = getSetup(m);

	return { signalType, setup, isValid: true, author: 'crypto-alerts' };
};
