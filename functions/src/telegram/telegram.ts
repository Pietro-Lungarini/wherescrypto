import { firestore } from 'firebase-admin';
import { config as env } from 'firebase-functions';
import { Api, TelegramClient } from 'telegram';
import { NewMessage, NewMessageEvent, Raw } from 'telegram/events';
import { StringSession } from 'telegram/sessions';
import { CryptoSignal } from '../models/crypto-signal.model';
import { ForexSignal } from '../models/forex-signal.model';
import {
  cryptoAlertsDbPath,
  handleSignal as handleCryptoCoreSignal,
} from '../utils/crypto-alerts/handleSignal';
import { logger } from '../utils/utils';
import { fxLegacy, fxLegacyDbPath } from './channels/handlers/fxLegacy';
import { fxIota, fxIotaDbPath } from './channels/handlers/fxIota';
import { tgChannels } from './channels/tg-channels';
import { fxLds, fxLdsDbPath } from './channels/handlers/fxLds';
import {
  commoditiesGamma,
  commoditiesGammaDbPath,
} from './channels/handlers/commoditiesGamma';
import {
  fxResistance,
  fxResistanceDbPath,
} from './channels/handlers/fxResistance';

/* API DOCS: https://gram.js.org/ */

const apiId = parseFloat(env().tg.api.id);
const apiHash = env().tg.api.hash;
const stringSession = new StringSession(env().tg.session);
const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

const TG_LOG_CHANNEL = -1001671886675;

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
    await client.sendMessage(TG_LOG_CHANNEL, { message: msg });
  },
  error: async (str: any, at?: string) => {
    if (typeof str !== 'string') {
      str = JSON.stringify(str);
    }
    const msg = `⛔️ **[ERR]** ${at ? '@ ' + at + ' ' : ''}=> ${str}`;
    logger.error(str, at);
    await client.sendMessage(TG_LOG_CHANNEL, { message: msg });
  },
};
const upsert = async (path: string, data: ForexSignal | CryptoSignal) => {
  try {
    if (!path || !data) return;
    const db = firestore();
    const docRef = db.doc(path);
    const doc = await docRef.get();

    const createdAt = doc.data()?.createdAt || new Date();
    data.createdAt = createdAt;
    data.updatedAt = new Date();
    await docRef.set(data, {
      merge: true,
    });
    await log.info(
      `Signal with id ${data.dbId} ${
        doc.exists ? 'updated' : 'created'
      }.\n\nPath is => ${path}`
    );
  } catch (error) {
    return log.error(error, 'upsert');
  }
};

// LOGICS
const isSupportedChannel = (id?: bigInt.BigInteger) => {
  if (!id) return false;
  let isSupported = false;
  const normId = BigInt(parseFloat(id.abs().toString()));
  tgChannels.forEach((channel) => {
    if (!channel.available) return;
    const isThis = channel.id === normId;
    if (isThis) isSupported = true;
  });
  return isSupported;
};
const redirectToSignalHandler = (m: Api.Message) => {
  if (!m.chatId) return;
  const normId = BigInt(parseInt(m.chatId?.abs().toString() || '0'));

  try {
    tgChannels.forEach(async (channel) => {
      const isThis = channel.id === normId;
      if (!isThis) return;
      log.info(`New message from **${channel.name}** =>\n\n${m.message}`);
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
          fxSignal = await commoditiesGamma(m);
          if (!fxSignal?.isValid) {
            log.error('This signal is not valid');
            break;
          }
          await upsert(commoditiesGammaDbPath(m), fxSignal);
          break;
        case 'cryptoAlerts':
          cryptoSignal = handleCryptoCoreSignal(
            m.message,
            m.id,
            new Date(m.date * 1000)
          );
          if (!cryptoSignal.isValid) {
            log.error('This signal is not valid');
            break;
          }
          await upsert(cryptoAlertsDbPath(cryptoSignal), cryptoSignal);
          break;
        case 'fxIota':
          fxSignal = await fxIota(m);
          if (!fxSignal?.isValid) {
            log.error('This signal is not valid');
            break;
          }
          await upsert(fxIotaDbPath(m), fxSignal);
          break;
        case 'fxLds':
          fxSignal = await fxLds(m);
          if (!fxSignal?.isValid) {
            log.error('This signal is not valid');
            break;
          }
          await upsert(fxLdsDbPath(m), fxSignal);
          break;
        case 'fxLegacy':
          fxSignal = await fxLegacy(m);
          if (!fxSignal?.isValid) {
            log.error('This signal is not valid');
            break;
          }
          await upsert(fxLegacyDbPath(m), fxSignal);
          break;
        case 'fxResistance':
          fxSignal = await fxResistance(m);
          if (!fxSignal?.isValid) {
            log.error('This signal is not valid');
            break;
          }
          await upsert(fxResistanceDbPath(m), fxSignal);
          break;
        case 'wheresbebo':
          /* TESTs ONLY */
          fxSignal = await fxResistance(m);
          if (!fxSignal?.isValid) {
            log.error('This signal is not valid');
            break;
          }
          await upsert(fxResistanceDbPath(m), fxSignal);
          break;

        default:
          break;
      }
    });
  } catch (error) {
    log.error(error, 'redirectToSignalHandler');
  }
};

// MAIN FUNC
export const listenForTgMessages = async () => {
  await init();

  const newMessage = async ({ message: msg }: NewMessageEvent) => {
    if (parseFloat(msg.chatId?.abs().toString() || '') === TG_LOG_CHANNEL)
      return;
    const isSupported = isSupportedChannel(msg.chatId);
    if (!isSupported) return;
    redirectToSignalHandler(msg);
  };

  const updateMessage = async (e: any) => {
    if (
      e.className !== 'UpdateEditMessage' &&
      e.className !== 'UpdateEditChannelMessage'
    )
      return;
    const channelId = await client.getPeerId(e.message.peerId);
    const msg = (
      await client.getMessages(channelId, { ids: e.message.ids })
    )[0];
    if (!msg) {
      log.error(
        'Non ho trovato nessun messaggio da aggiornare. Impossibile aggiornare il segnale.'
      );
    }
    if (parseFloat(msg.chatId?.abs().toString() || '') === TG_LOG_CHANNEL)
      return;
    const isSupported = isSupportedChannel(msg.chatId);
    if (!isSupported) return;
    redirectToSignalHandler(msg);
  };

  client.addEventHandler(newMessage, new NewMessage({}));
  client.addEventHandler(updateMessage, new Raw({}));
};
