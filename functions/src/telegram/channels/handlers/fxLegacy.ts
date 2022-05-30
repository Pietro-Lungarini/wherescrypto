import { firestore } from 'firebase-admin';
import { Api } from 'telegram';
import {
  ForexSignal,
  ForexSignalSetup,
} from '../../../models/forex-signal.model';

const DB_PATH = 'fxLegacy';

const getId = (msgId: number, msgDate: Date) => {
  return `fx_${msgId}_${new Date(msgDate).getTime()}`;
};
const handleSignal = (msg: Api.Message): ForexSignalSetup | undefined => {
  const text = msg.message.toLowerCase();

  // Get Side
  const side = () => {
    return text.includes('buy')
      ? 'buy'
      : text.includes('sell')
      ? 'sell'
      : undefined;
  };

  // Get Cross
  const cross = () => {
    const sideStr = side() === 'buy' ? '🔵' : '🔴';
    const sideRegex = side() === 'buy' ? /🔵/g : /🔴/g;
    const i1 = text.indexOf(sideStr);
    if (i1 === -1) return '';
    const i2 = text.indexOf(sideStr, i1 + 1);
    const str = text.substring(i1, i2).replace(sideRegex, '').trim();
    return str
      .replace(side() || '', '')
      .replace('limit', '')
      .trim();
  };

  if (!cross()) return;

  // Get Entry
  const entry = () => {
    const i1 = text.indexOf('entry');
    const i2 = text.indexOf('\n', i1 + 1);
    const str = text
      .substring(i1, i2)
      .replace(/([^0-9.])/g, '')
      .trim();
    return parseFloat(str);
  };

  // Get StopLoss
  const sl = () => {
    const i1 = text.indexOf('sl');
    const i2 = text.indexOf('\n', i1 + 1);
    const str = text
      .substring(i1, i2)
      .replace(/([^0-9.])/g, '')
      .trim();
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
    const str = text
      .substring(i1, i2)
      .replace(replaceStr, '')
      .replace(/([^0-9.])/g, '')
      .trim();
    return parseFloat(str);
  };

  // Get TP2
  const tp2 = () => {
    const replaceStr = 'tp2';
    if (!text.includes(replaceStr)) return undefined;
    const i1 = text.indexOf(replaceStr);
    const i2 = text.indexOf('\n', i1 + 1);
    const str = text
      .substring(i1, i2)
      .replace(replaceStr, '')
      .replace(/([^0-9.])/g, '')
      .trim();
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
    const str = subStr
      .replace(replaceStr, '')
      .replace(/([^0-9.])/g, '')
      .trim();
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
    const str = subStr
      .replace(replaceStr, '')
      .replace(/([^0-9.])/g, '')
      .trim();
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
    const str = subStr
      .replace(replaceStr, '')
      .replace(/([^0-9.])/g, '')
      .trim();
    return parseFloat(str);
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
    tp4: tp4(),
    tp5: tp5(),
  };
};
const handleUpdate = async (
  msg: Api.Message
): Promise<ForexSignal | undefined> => {
  const original = await msg.getReplyMessage();
  const text = msg.message.toLowerCase();
  if (!original) return;
  const docRef = firestore().doc(fxLegacyDbPath(original));
  const document = await docRef.get();
  if (!document.exists) return;

  const include = (word: string) => text.includes(word);

  if (include('sl hit')) return;

  if (include('be hit')) return;

  if (include('tp hit')) return;

  if (include('cancel')) {
    return {
      ...(document.data() as ForexSignal),
      action: ['cancel'],
    };
  }

  if (include('secure')) {
    return {
      ...(document.data() as ForexSignal),
      action: ['break-even'],
    };
  }

  if (include('partial')) {
    return {
      ...(document.data() as ForexSignal),
      action: ['partial-close'],
      actionOptions: {
        closeQty: 0.5,
      },
    };
  }

  return;
};

export const fxLegacyDbPath = (msg: Api.Message) => {
  return `signals/${DB_PATH}/signals/${getId(
    msg.id,
    new Date(msg.date * 1000)
  )}`;
};

export const fxLegacy = async (
  msg: Api.Message
): Promise<ForexSignal | undefined> => {
  if (msg.isReply) {
    return await handleUpdate(msg);
  } else {
    const elabSetup = handleSignal(msg);
    let isValid = true;
    if (!elabSetup) isValid = false;
    return {
      channel: 'fxLegacy',
      isValid: isValid,
      action: ['new'],
      date: new Date(msg.date * 1000),
      dbId: getId(msg.id, new Date(msg.date * 1000) || new Date()),
      id: msg.id,
      setup: elabSetup,
    };
  }
};
