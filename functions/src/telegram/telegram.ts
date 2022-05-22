import { firestore } from 'firebase-admin';
import { config as env } from 'firebase-functions';
import { Api, TelegramClient } from 'telegram';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { StringSession } from 'telegram/sessions';
import { CryptoSignal } from '../models/crypto-signal.model';
import { ForexSignal } from '../models/forex-signal.model';
import { handleSignal as handleCryptoCoreSignal } from '../utils/crypto-alerts/handleSignal';
import { logger } from '../utils/utils';
import { fxLegacy } from './channels/handlers/fxLegacy';
import { tgChannels } from './channels/tg-channels';

/* API DOCS: https://gram.js.org/ */

const apiId = parseInt(env().tg.api.id);
const apiHash = env().tg.api.hash;
const stringSession = new StringSession(env().tg.session);
const client = new TelegramClient(stringSession, apiId, apiHash, {
	connectionRetries: 5,
});

const init = async () => {
	if (!client.connected) {
		await client.connect();
	}
};
const log = {
	info: async (str: any, at?: string) => {
		if (typeof str !== 'string') {
			str = JSON.stringify(str);
		}
		const msg = `ℹ️ **[LOG]** ${at ? '@ ' + at + ' ' : ''}=> ${str}`;
		logger.info(str, at);
		await client.sendMessage(-1001671886675, { message: msg });
	},
	error: async (str: any, at?: string) => {
		if (typeof str !== 'string') {
			str = JSON.stringify(str);
		}
		const msg = `⛔️ **[ERR]** ${at ? '@ ' + at + ' ' : ''}=> ${str}`;
		logger.error(str, at);
		await client.sendMessage(-1001671886675, { message: msg });
	},
};
const upsert = async (path: string, data: any) => {
	const db = firestore();
	const docRef = db.doc(path);
	const doc = await docRef.get();

	const createdAt = doc.data()?.createdAt || new Date();
	data.createdAt = createdAt;
	await docRef.set(data, {
		merge: true,
	});
};


// LOGICS
const isSupportedChannel = (id?: bigInt.BigInteger) => {
	if (!id) return false;
	let isSupported = false;
	const normId = BigInt(parseInt(id.abs().toString()));
	tgChannels.forEach((channel) => {
		const isThis = channel.id === normId;
		if (isThis) isSupported = true;
	});
	return isSupported;
};

const createId = (signal: CryptoSignal) => {
	const d = signal.date ? signal.date : new Date();
	const time = d.getTime();
	return `${signal.signalType}_${signal.id ? `${signal.id}_` : ''}${signal.setup?.pair ? `${signal.setup?.pair}_` : ''}${time}`;
};

const redirectToSignalHandler = (m: Api.Message) => {
	if (!m.chatId) return;
	const normId = BigInt(parseInt(m.chatId?.abs().toString() || '0'));

	tgChannels.forEach(async (channel) => {
		const isThis = channel.id === normId;
		if (!isThis) return;
		log.info(`New message from **${channel.shortName}** =>\n\n${m.message}`);
		let cryptoSignal: CryptoSignal | undefined;
		let fxSignal: ForexSignal | undefined;

		switch (channel.shortName) {
		case 'binaryAlpha':
			/* ... */
			break;
		case 'binaryDelta':
			/* ... */
			break;
		case 'binaryOmega':
			/* ... */
			break;
		case 'commoditiesAlpha':
			/* ... */
			break;
		case 'commoditiesGamma':
			/* ... */
			break;
		case 'cryptoAlerts':
			cryptoSignal = handleCryptoCoreSignal(m.message);
			cryptoSignal.date = new Date(m.date || new Date());
			if (!cryptoSignal.isValid) break;
			cryptoSignal.id = m.id;
			cryptoSignal.dbId = createId(cryptoSignal);
			log.info('I\'ve elaborated the signal, updating on the db...');
			await upsert(`signals/crypto-alerts/signals/${cryptoSignal.dbId}`, cryptoSignal);
			log.info(`Upload completed for signal ${cryptoSignal.dbId}`);
			break;
		case 'fxIota':
			/* ... */
			break;
		case 'fxLds':
			/* ... */
			break;
		case 'fxLegacy':
			fxSignal = await fxLegacy(m);
			log.info('I\'ve elaborated the signal, updating on the db...');
			log.info(fxSignal);
			break;
		case 'fxResistance':
			/* ... */
			break;
		case 'wheresbebo':
			/* TESTs ONLY */
			break;

		default:
			break;
		}
	});
};


// MAIN FUNC
export const listenForTgMessages = async () => {
	await init();

	async function handler({ message: msg }: NewMessageEvent) {
		const isSupported = isSupportedChannel(msg.chatId);
		if (!isSupported) return log.error(`Questo canale non è supportato per i segnali: ${msg.chatId}`);
		/* log.info(`msg => ${message.message}\n\nsupported => ${isSupported}`, 'listenForTgMessages'); */
		redirectToSignalHandler(msg);
		log.info(`This message was sent on Timestamp (RAW): ${msg.date} Date: ${new Date(msg.date)}`);
	}

	client.addEventHandler(handler, new NewMessage({}));
};

