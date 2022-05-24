import { firestore } from 'firebase-admin';
import { Api } from 'telegram';
import { ForexSignal, ForexSignalSetup } from '../../../models/forex-signal.model';
import { logger } from '../../../utils/utils';

const DB_PATH = 'commoditiesGamma';

const getId = (msgId: number, msgDate: Date) => {
	return `fx_${msgId}_${new Date(msgDate).getTime()}`;
};
const handleSignal = (msg: Api.Message): ForexSignalSetup | undefined => {
	const text = msg.message.toLowerCase() + '\n';

	// Get Side
	const side = () => {
		return text.includes('buy') ? 'buy' : text.includes('sell') ? 'sell' : undefined;
	};

	const type = () => {
		return text.includes('limit') ?
        'limit' :
        text.includes('stop') ?
        'stop' :
        'market';
	};

	// Get Cross
	const cross = () => {
		const i1 = text.indexOf(side() || type());
		const i2 = text.indexOf('\n');
		const str = text.substring(i1, i2).trim();
		return str.replace(side() || '', '').replace(type(), '').trim();
	};

	if (!cross()) return;

	// Get Entry
	const entry = () => {
		const i1 = text.indexOf('entry');
		const i2 = text.indexOf('\n', i1 + 1);
		const str = text.substring(i1, i2).replace(/([^0-9.])/g, '').trim();
		return parseFloat(str);
	};

	// Get StopLoss
	const sl = () => {
		const i1 = text.indexOf('sl');
		const i2 = text.indexOf('\n', i1 + 1);
		const str = text.substring(i1, i2).replace(/([^0-9.])/g, '').trim();
		return parseFloat(str);
	};

	// Get TP1
	const tp1 = () => {
		let replaceStr = 'tp1';
		let i1 = text.indexOf(replaceStr);
		if (i1 === -1) {
			i1 = text.indexOf('tp');
			replaceStr = 'tp';
		}
		const i2 = text.indexOf('\n', i1 + 1);
		const str = text.substring(i1, i2).replace(/([^0-9.])/g, '').trim();
		return parseFloat(str);
	};

	// Get TP2
	const tp2 = () => {
		let replaceStr = 'tp2';
		if (!text.includes(replaceStr)) return undefined;
		const i1 = text.indexOf(replaceStr);
		const i2 = text.indexOf('\n', i1 + 1);
		const str = text.substring(i1, i2).replace(/([^0-9.])/g, '').trim();
		return parseFloat(str);
	};

	// Get TP3
	const tp3 = () => {
		let replaceStr = 'tp3';
		if (!text.includes(replaceStr)) return undefined;
		const i1 = text.indexOf(replaceStr);
		const i2 = text.indexOf('\n', i1 + 1);
		const subStr = text.substring(i1, i2);
		if (subStr.includes('open')) return 'open';
		const str = subStr.replace(/([^0-9.])/g, '').trim();
		return parseFloat(str);
	};

	// Get TP4
	const tp4 = () => {
		let replaceStr = 'tp4';
		if (!text.includes(replaceStr)) return undefined;
		const i1 = text.indexOf(replaceStr);
		const i2 = text.indexOf('\n', i1 + 1);
		const subStr = text.substring(i1, i2);
		if (subStr.includes('open')) return 'open';
		const str = subStr.replace(/([^0-9.])/g, '').trim();
		return parseFloat(str);
	};
	
	// Get TP5
	const tp5 = () => {
		let replaceStr = 'tp5';
		if (!text.includes(replaceStr)) return undefined;
		const i1 = text.indexOf(replaceStr);
		const i2 = text.indexOf('\n', i1 + 1);
		const subStr = text.substring(i1, i2);
		if (subStr.includes('open')) return 'open';
		const str = subStr.replace(/([^0-9.])/g, '').trim();
		return parseFloat(str);
	};

	return {
		cross: cross(),
		side: side(),
		orderType: type(),
		entry: entry(),
		sl: sl(),
		tp1: tp1(),
		tp2: tp2(),
		tp3: tp3(),
		tp4: tp4(),
		tp5: tp5(),
	};
};
const handleUpdate = async (msg: Api.Message): Promise<ForexSignal | undefined> => {
	const original = await msg.getReplyMessage();
	const msgId = original?.id || 0;
	const text = msg.message.toLowerCase();
	const dbId = getId(msgId, new Date(msg.date * 1000) || new Date());

	const docRef = firestore().doc(dbId);
	const document = await docRef.get();
	if (!document.exists) return;

	const include = (word: string) => text.includes(word);

	if (
		include('move sl') ||
		include('move your sl')
	) {
		const moveSl = () => {
			const text1 = text + '\n';
			const rStr = 'sl';
			const i1 = text1.indexOf(rStr);
			const i2 = text1.indexOf('\n');
			const normText = text1.substring(i1, i2);
			if (normText.includes('entry')) return 'entry';
			if (normText.includes('tp')) return 'tp';
			if (normText.includes('tp1')) return 'tp1';
			if (normText.includes('tp2')) return 'tp2';
			if (normText.includes('tp3')) return 'tp3';
			if (normText.includes('tp4')) return 'tp4';
			if (normText.includes('tp5')) return 'tp5';
			const res = normText.replace(/([^0-9.])/g, '').trim();
			return parseFloat(res);
		};
		return {
			...document.data() as ForexSignal,
			action: ['move-sl'],
			actionOptions: {
				moveSl: moveSl()
			},
		};
	}

	if (include('cancel')) {
		return {
			...document.data() as ForexSignal,
			action: ['cancel'],
		};
	}

	if (
		include('close it')
	) {
		return {
			...document.data() as ForexSignal,
			action: ['close-all']
		}
	}

	if (
		include('close half')
	) {
		return {
			...document.data() as ForexSignal,
			action: ['partial-close'],
			actionOptions: {
				closeQty: 0.5,
			}
		}
	}

	return;
};

export const commoditiesGammaDbPath = (msg: Api.Message) => {
	return `signals/${DB_PATH}/signals/${getId(msg.id, new Date(msg.date * 1000))}`;
};

export const commoditiesGamma = async (msg: Api.Message): Promise<ForexSignal | undefined> => {
	if (msg.isReply) {
		logger.info('isReply');
		return await handleUpdate(msg);
	} else {
		logger.info('isNotReply');
		const elabSetup = handleSignal(msg);
		let isValid = true;
		if (!elabSetup) isValid = false;
		return {
			channel: 'commoditiesGamma',
			isValid: isValid,
			action: ['new'],
			date: new Date(msg.date * 1000),
			dbId: getId(msg.id, new Date(msg.date * 1000) || new Date()),
			id: msg.id,
			setup: elabSetup,
		};
	}
};
