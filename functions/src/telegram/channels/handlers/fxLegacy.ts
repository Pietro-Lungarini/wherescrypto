import { firestore } from 'firebase-admin';
import { Api } from 'telegram';
import { ForexSignal, ForexSignalSetup } from '../../../models/forex-signal.model';
import { logger } from '../../../utils/utils';

const DB_PATH = 'fxLegacy';

const getId = (msgId: number, msgDate: Date) => {
	return `signals/${DB_PATH}/signals/fx_${msgId}_${new Date(msgDate).getTime()}`;
};
const handleSignal = (msg: Api.Message): ForexSignalSetup => {
	const text = msg.message.toLowerCase();

	// Get Cross
	const cross = () => {
		const i1 = text.indexOf('🔵');
		const i2 = text.indexOf('🔵', i1);
		const str = text.substring(i1, i2).replace(/🔵/g, '').trim();
		return str.replace(side() || '', '').replace('limit', '').trim();
	};

	// Get Side
	const side = () => {
		return text.includes('buy') ? 'buy' : text.includes('sell') ? 'sell' : undefined;
	};

	// Get Entry
	const entry = () => {
		const i1 = text.indexOf('entry');
		const i2 = text.indexOf('\n', i1);
		const str = text.substring(i1, i2).replace('entry price:', '').trim();
		return parseInt(str);
	};

	// Get StopLoss
	const sl = () => {
		const i1 = text.indexOf('sl');
		const i2 = text.indexOf('\n', i1);
		const str = text.substring(i1, i2).replace('sl:', '').trim();
		return parseInt(str);
	};

	// Get TP1
	const tp1 = () => {
		let replaceStr = 'tp1';
		let i1 = text.indexOf(replaceStr);
		if (i1 === -1) {
			i1 = text.indexOf('tp');
			replaceStr = 'tp';
		}
		const i2 = text.indexOf('\n', i1);
		const str = text.substring(i1, i2).replace(`${replaceStr}:`, '').trim();
		return parseInt(str);
	};

	// Get TP2
	const tp2 = () => {
		let replaceStr = 'tp2';
		if (!text.includes(replaceStr)) return undefined;
		let i1 = text.indexOf(replaceStr);
		if (i1 === -1) {
			i1 = text.indexOf('tp');
			replaceStr = 'tp';
		}
		const i2 = text.indexOf('\n', i1);
		const str = text.substring(i1, i2).replace(`${replaceStr}:`, '').trim();
		return parseInt(str);
	};

	// Get TP3
	const tp3 = () => {
		let replaceStr = 'tp3';
		if (!text.includes(replaceStr)) return undefined;
		let i1 = text.indexOf(replaceStr);
		if (i1 === -1) {
			i1 = text.indexOf('tp');
			replaceStr = 'tp';
		}
		const i2 = text.indexOf('\n', i1);
		const str = text.substring(i1, i2).replace(`${replaceStr}:`, '').trim();
		return parseInt(str);
	};

	return {
		cross: cross(),
		side: side(),
		orderType: 'limit',
		entry: entry(),
		sl: sl(),
		tp1: tp1(),
		tp2: tp2(),
		tp3: tp3(),
	};
};
const handleUpdate = async (msg: Api.Message): Promise<ForexSignal | undefined> => {
	const original = await msg.getReplyMessage();
	const msgId = original?.id || Math.random();
	const text = msg.message.toLowerCase();
	const dbId = getId(msgId, new Date(msg.date) || new Date());

	const docRef = firestore().doc(dbId);
	const document = await docRef.get();
	if (!document.exists) return;

	const include = (word: string) => text.includes(word);

	if (include('sl hit')) return;

	if (include('be hit')) return;

	if (include('tp hit')) return;

	if (include('cancel')) {
		return {
			...document.data() as ForexSignal,
			action: 'cancel',
		};
	}

	if (include('secure')) {
		return {
			...document.data() as ForexSignal,
			action: 'break-eaven',
		};
	}

	if (include('partial')) {
		return {
			...document.data() as ForexSignal,
			action: 'partial-close',
			actionOptions: {
				closeQty: 0.5,
			},
		};
	}
	/* THIS IS A COMMIT TEST */
	return;
};

export const fxLegacy = async (msg: Api.Message): Promise<ForexSignal | undefined> => {
	if (msg.isReply) {
		logger.info('isReply');
		return await handleUpdate(msg);
	} else {
		logger.info('isNotReply');
		return {
			channel: 'fxLegacy',
			isValid: true,
			action: 'new',
			date: new Date(msg.date),
			dbId: getId(msg.id, new Date(msg.date) || new Date()),
			id: msg.id,
			setup: handleSignal(msg),
		};
	}
};
