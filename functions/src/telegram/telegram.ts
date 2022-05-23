import { firestore } from 'firebase-admin';
import { config as env } from 'firebase-functions';
import { Api, TelegramClient } from 'telegram';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { StringSession } from 'telegram/sessions';
import { CryptoSignal } from '../models/crypto-signal.model';
import { ForexSignal } from '../models/forex-signal.model';
import { cryptoAlertsDbPath, handleSignal as handleCryptoCoreSignal } from '../utils/crypto-alerts/handleSignal';
import { logger } from '../utils/utils';
import { fxLegacy, fxLegacyDbPath } from './channels/handlers/fxLegacy';
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
			cryptoSignal = handleCryptoCoreSignal(m.message, m.id, new Date(m.date * 1000));
			if (!cryptoSignal.isValid) break;
			await log.info('I\'ve elaborated the signal, updating on the db...');
			await upsert(cryptoAlertsDbPath(cryptoSignal), cryptoSignal);
			await log.info(`Upload completed for signal ${cryptoSignal.dbId}`);
			break;
		case 'fxIota':
			/* ... */
			break;
		case 'fxLds':
			/* ... */
			break;
		case 'fxLegacy':
			fxSignal = await fxLegacy(m);
			await log.info('I\'ve elaborated the signal, updating on the db...');
			await log.info(fxSignal);
			break;
		case 'fxResistance':
			/* ... */
			break;
		case 'wheresbebo':
			/* TESTs ONLY */
			fxSignal = await fxLegacy(m);
			await log.info('I\'ve elaborated the signal, updating on the db...');
			await upsert(fxLegacyDbPath(m), fxSignal);
			await log.info(`Upload completed for signal ${fxSignal?.dbId}`);
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
		log.info(`This message was sent on Date: ${new Date(msg.date * 1000)}`);
	}

	client.addEventHandler(handler, new NewMessage({}));
};

