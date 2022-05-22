import * as admin from 'firebase-admin';
import * as ffn from 'firebase-functions';
import { Telegraf } from 'telegraf';
import { startDiscordBot } from './discord/discord';
import { verifyClient } from './igenius/igenius';
import { test } from './metaapi/metaapi';
import { CryptoSignal } from './models/crypto-signal.model';
import { iGeniusRequestedUsers } from './models/igenius.model';
import { getTransactionUrl, setPubKey } from './store/store';
import { listenForTgMessages } from './telegram/telegram';
import { handleSignal as handleCryptoCoreSignal } from './utils/crypto-alerts/handleSignal';
import { openSignal as openCryptoAlertsSignal } from './utils/crypto-alerts/orders';
import { handleSignal as handleFuturesSignal } from './utils/futures-signals/handleSignal';
import {
	DB_NAMES,
	getSignalDbName,
	isValidChatId,
} from './utils/utils';

admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties: true });
const functions = ffn.region('europe-west2');


// CONFIGURE TG BOT
const bot = new Telegraf(ffn.config().telegram.token, {
	telegram: { webhookReply: true },
});
bot.launch({
	// Launch bot with webhook
	webhook: {
		hookPath: ffn.config().telegram.webhook,
	},
});
bot.catch((err, ctx) => {
	// Error handling
	ffn.logger.error('[Bot] Error', err);
	ctx.reply(`Ooops, ho rilevato un'errore: ${ctx.updateType}`, err as any);
});
// END - CONFIGURE TG BOT

// TEMPORARY
/* const handleMessage = (msg: Signal) => {
	const setup = msg.setup;
	if (!setup) return '';
	let targets = '';
	let shadTargets = '';
	setup.targets?.forEach((t) => {
		targets += `\nTarget ${t.id}: ${t.price} ${t.currency} (${(t.quantity || 0) * 100}%)`;
	});
	setup.shadTargets?.forEach((t) => {
		if (t.tbd) {
			return shadTargets += `\nShad Target ${t.id}: To be defined`;
		}
		return shadTargets += `\nShad Target ${t.id}: ${t.price} ${t.currency} (${(t.quantity || 0) * 100}%)`;
	});
	return 'Signal received - ' +
		msg.signalType + '\n\nPair: ' +
		setup.pair + '\n\nEntry: ' +
		setup.entry?.orderType + ' @ ' +
		(setup.entry?.currency || '') + ' ' +
		(setup.entry?.price || '') + '\nSafe Entry: ' +
		setup.safeEntry?.orderType + ' @ ' +
		(setup.safeEntry?.currency || '') + ' ' +
		(setup.safeEntry?.price || '') + '\nAggressive Entry: ' +
		setup.aggressiveEntry?.orderType + '\n\nTargets:' +
		targets + '\n\nShad Targets:' + (shadTargets || '\n---none---') +
		'\n\nReccomended position: ' + (setup.position || 0) * 100 + '%' +
		'\n\nStop Loss: ' + (setup.stopLoss?.isValid ?
		(setup.stopLoss?.price || '') + setup.stopLoss?.currency : 'none') +
		'\n\nExchanges: ' + setup.exchanges?.join(', ') // + '\n\n\n\n' + JSON.stringify(setup)
	;
}; */

const tgLogError = (msg: string) => {
	/* bot.telegram.sendMessage(CRYPTO_ALERTS_TG_ID, msg); */
	ffn.logger.error('[ERR] ' + msg);
};


// Handle new signal
bot.on('channel_post', (ctx) => {
	if (!('text' in ctx.update.channel_post)) {
		return tgLogError('No text in channel post!');
	}

	const chatId = ctx.update.channel_post.chat.id;
	const messageId = Math.abs(ctx.update.channel_post.message_id);
	const text = ctx.update.channel_post.text;

	if (isValidChatId(chatId)) {
		return tgLogError('This chat is not suitable for Signals! Check ChatId.');
	}

	if (!text) {
		return tgLogError('The signal do not have the right data.');
	}

	let msg: CryptoSignal;
	if (getSignalDbName(chatId) === 'crypto-alerts') {
		msg = handleCryptoCoreSignal(text);
	} else if (getSignalDbName(chatId) === 'futures-signals') {
		msg = handleFuturesSignal(text);
	} else {
		msg = { isValid: false, author: 'undefined' };
	}

	if (msg.isValid) {
		/* bot.telegram.sendMessage(chatId, handleMessage(msg), {
			reply_to_message_id: ctx.update.channel_post.message_id,
		}); */

		const createId = () => {
			const d = new Date();
			const day = d.getDate();
			const month = d.getMonth() + 1;
			const year = d.getFullYear();
			const time = d.getTime();
			if (!messageId) {
				return `${msg.signalType}_${
					msg.setup?.pair || ''
				}_${day}_${month}_${year}_${time}`;
			}
			return `${msg.signalType}_${ctx.update.channel_post.message_id}_${day}_${month}_${year}_${time}`;
		};

		admin
			.firestore()
			.doc(`signals/${getSignalDbName(chatId)}/signals/${createId()}`)
			.set({
				...msg,
				id: messageId,
				createdAt: new Date(),
			});

		return;
	}

	return tgLogError('Signal is invalid!');
});

// Start Discord Bot
startDiscordBot();


// Handle Telegram Webhook
exports.telegramBotListener = functions.https.onRequest(
	async (request: any, response: any) => {
		return await bot.handleUpdate(request.body, response).then((rv: any) => {
			// if it's not a request from telegram, rv will be undefined, but we should respond with 200
			return !rv && response.sendStatus(200);
		});
	},
);


// Handle new writes on Crypto Alerts
exports.onNewSignal = functions.firestore
	.document(`signals/${DB_NAMES.cryptoAlerts}/signals/{docId}`)
	.onWrite(async (change) => {
		const data = change.after.data() as CryptoSignal;
		if (!data) tgLogError('No valid data');

		await openCryptoAlertsSignal(data);
	});


// Handle new writes on Futures Signals
exports.onNewFuturesSignal = functions.firestore
	.document(`signals/${DB_NAMES.futuresSignals}/signals/{docId}`)
	.onWrite(async (change) => {
		const data = change.after.data() as CryptoSignal;
		if (!data) tgLogError('No valid data');

		// await openCryptoAlertsSignal(data); // TODO
	});


// Get transaction Url for store
exports.getTransactionUrl = functions.https.onCall(async (data) => {
	const url = await getTransactionUrl(data);
	return url;
});


// Handle new writes on Futures Signals
exports.onPubKeyChange = functions.firestore
	.document('shop/settings')
	.onUpdate(async (change) => {
		const data = change.after.data();
		if (!data || !data.pubKey) return;

		setPubKey(data.pubKey);
	});


// Start Discord Bot
exports.discord = functions.https.onRequest(async (req, res) => {
	/* await startDiscordBot(); */
	res.status(200).send('Ok');
	return;
});


// Forex Signals
exports.testSignal = functions.https.onCall(async (data) => {
	return await test(data.id, data.signal);
});


// iGenius Verify Code
exports.verifyClient = functions.runWith({
	timeoutSeconds: 540,
	memory: '4GB',
}).https.onCall(async (data, ctx) => {
	const reqUser: iGeniusRequestedUsers = {
		date: new Date(),
		email: ctx.auth?.token.email,
		uid: ctx.auth?.token.uid,
		pip: ctx.auth?.token.picture,
	};
	return await verifyClient(data.id, reqUser);
});

listenForTgMessages();


// Scheduled function
/* exports.scheduledAccountsCheck = functions.pubsub
	.schedule('every 3 days')
	.timeZone('Europe/Rome')
	.onRun((ctx) => {
		const users = admin
			.firestore()
			.collection('users')
			.get();
	}); */
