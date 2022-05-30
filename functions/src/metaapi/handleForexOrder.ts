import { ForexSignal } from '../models/forex-signal.model';
import { logger } from '../utils/utils';
import { getAccountConnection, mtOrder } from './metaapi';
import { MTForexSignal } from './models/forexSignal.model';
import { firestore } from 'firebase-admin';
import { MTAccount } from './models/mtAccount';
import { MetatraderTradeResponse } from 'metaapi.cloud-sdk';

interface MTResponse extends MetatraderTradeResponse {
  tp: string;
}

const symbolsException = (cross: string) => {
  switch (cross) {
    case 'gold':
      return 'XAUUSD';
    case 'dow jones':
      return 'US30';
    case 'dowjones':
      return 'US30';
    default:
      return cross.toUpperCase();
  }
};

const getChannelRisk = async (
  uid: string,
  accountId: string,
  channel: string
) => {
  try {
    const db = firestore();
    const docRef = db.doc(`users/${uid}/fxAccounts/${accountId}`);
    const doc = await docRef.get();
    if (!doc.exists) return;
    const data = doc.data();
    if (!data) return;
    const isEnabled = data.channels[channel].enabled;
    if (!isEnabled) return;
    const risk = data.channels[channel].risk;
    return risk as number;
  } catch (error) {
    logger.error(error, 'getChannelRisk');
    return error;
  }
};

export const getAccountRisk = async (
  uid: string,
  accountId: string,
  signal: ForexSignal,
): Promise<{lot: number, slPips: number}> => {
  const invalidRes = {
    lot: 0,
    slPips: 0
  };
  try {
    if (!signal.setup) return invalidRes;
    const risk = await getChannelRisk(uid, accountId, signal.channel);
    if (typeof risk !== 'number') return invalidRes;
    const account = await getAccountConnection(accountId);
    const info = await account?.getAccountInformation();
    if (!info) return invalidRes;
    const balance = info.freeMargin;
    const accCurr = info.currency;
    const entry = signal.setup.entry;
    const sl = signal.setup.sl;
    logger.info({balance, accCurr, entry, sl})
    let tpCounts = 0;
    if (signal.setup.tp1 && signal.setup.tp1 !== 'open') tpCounts++;
    if (signal.setup.tp2 && signal.setup.tp2 !== 'open') tpCounts++;
    if (signal.setup.tp3 && signal.setup.tp3 !== 'open') tpCounts++;
    if (signal.setup.tp4 && signal.setup.tp4 !== 'open') tpCounts++;
    if (signal.setup.tp5 && signal.setup.tp5 !== 'open') tpCounts++;
    if (tpCounts === 0) return invalidRes;
    const symbol = await account?.getSymbolSpecification(
      symbolsException(signal.setup.cross)
    );
    if (!symbol) return invalidRes;
    const minLot = symbol.minVolume;
    const lotStep = symbol.volumeStep;
    const quoteCurr = symbol.profitCurrency;
    let exchangeRate = 1;
    if (accCurr === quoteCurr) {
      logger.info('Is accCurr === quoteCurr');
      exchangeRate = 1;
    } else {
      const exRatePrice = await account?.getSymbolPrice(
        accCurr + quoteCurr,
        false
      );
      if (!exRatePrice) return invalidRes;
      exchangeRate = parseFloat(exRatePrice?.bid);
    }
    const balanceAtRisk = balance * risk;
    const contractSize = symbol.contractSize;
    const digits = symbol.digits;
    const pipSize = symbol.pipSize || 0;
    const slInPips = Math.round(Math.abs(entry - sl) / pipSize);
    const perPip = (balanceAtRisk * exchangeRate) / slInPips;
    const multiplier = Math.pow(10, digits - 1);
    const positionSize = perPip * multiplier;
    const normPositionSize = positionSize / tpCounts;

    logger.info({minLot, lotStep, quoteCurr, exchangeRate, balanceAtRisk, contractSize, digits, pipSize, slInPips, perPip, multiplier, positionSize, tpCounts, normPositionSize})


    const lot = normPositionSize / contractSize; // LOT SIZE

    logger.info(lot)


    if (lot < minLot) return invalidRes;

    const roundLot = (lot: number, min: number, step: number) => {
      const a = Math.ceil((lot - min) / step) * step + min;
      return parseFloat(a.toFixed(3));
    };

    logger.info({lot, slInPips})

    return {
      lot: roundLot(lot, minLot, lotStep),
      slPips: slInPips,
    };
  } catch (error) {
    logger.error(error, 'getAccountRisk');
    return invalidRes;
  }
};

const handleForexOrder = async (signal: MTForexSignal) => {
  if (!signal) return;
  const account = await getAccountConnection(signal.accountId);
  if (!account) return;

  const buy = mtOrder.buy;
  const sell = mtOrder.sell;
  let res;

  try {
    if (signal.side === 'buy') {
      switch (signal.type) {
        case 'market':
          res = await buy.market(account, signal);
          break;
        case 'limit':
          res = await buy.limit(account, signal);
          break;
        case 'stop':
          res = await buy.stop(account, signal);
          break;
        case 'stop-limit':
          res = await buy.stopLimit(account, signal);
          break;

        default:
          break;
      }
    } else {
      switch (signal.type) {
        case 'market':
          res = await sell.market(account, signal);
          break;
        case 'limit':
          res = await sell.limit(account, signal);
          break;
        case 'stop':
          res = await sell.stop(account, signal);
          break;
        case 'stop-limit':
          res = await sell.stopLimit(account, signal);
          break;

        default:
          break;
      }
    }
  } catch (error) {
    logger.error(error, 'handleForexOrder');
    return;
  }

  return res;
};

const forexSignalToMT = async (
  signal: ForexSignal,
  accountId: string,
  uid: string,
  trailingStop: boolean,
): Promise<MTForexSignal | undefined> => {
  if (!signal || !signal.setup || !signal.setup.side) return;
  const symbol = symbolsException(signal.setup.cross);
  const { lot, slPips } = await getAccountRisk(uid, accountId, signal);
  if (!lot || lot === 0) return;
  return {
    accountId,
    uid,
    stopLossPips: slPips,
    signalId: signal.dbId,
    side: signal.setup.side,
    type: signal.setup.orderType,
    openPrice: signal.setup.entry,
    symbol: [symbol as any],
    lot,
    stopLoss: {
      units: 'ABSOLUTE_PRICE',
      value: signal.setup.sl,
    },
    tps: {
      tp1: signal.setup.tp1,
      tp2: signal.setup.tp2,
      tp3: signal.setup.tp3,
      tp4: signal.setup.tp4,
      tp5: signal.setup.tp5,
    },
    trailingStop,
  };
};

export const sendSignalToAccounts = async (signal: ForexSignal) => {
  try {
    
    const db = firestore();
    const colRef = db.collection('users');
    const users = (await colRef.where('hasMtAccounts', '==', true).get()).docs;
    const accountsPromises: Promise<
      firestore.QuerySnapshot<firestore.DocumentData>
    >[] = [];
    
    users.forEach((u) => {
      if (!u.exists) throw new Error(`User with id "${u.id}" does not exist.`);
      const subColDocs = colRef.doc(u.id).collection('fxAccounts').get();
      accountsPromises.push(subColDocs);
    });
    
    const res = await Promise.all(accountsPromises);
    const signalsPromises: Promise<MTForexSignal | undefined>[] = [];
    res.forEach((accounts) => {
      accounts.docs.forEach((account) => {
        const a = account.data() as MTAccount;
        if (!a.accountId) throw new Error(`Account with login "${a.login}" doesn't exist on user with id "${a.uid}".`);
        const channel = (a.channels as any)[signal.channel];
        if (!channel || !channel.enabled) throw new Error(`Haven't found any channel on user with id "${a.uid}" in account with id "${a.accountId}".`);
        signalsPromises.push(forexSignalToMT(signal, a.accountId, a.uid, channel.trailingStop));
      });
    });
    const signals = await Promise.all(signalsPromises);
    
    const batch = db.batch();
    for (const s of signals) {
      if (!s || !s.uid || !s.accountId || !s.tps) throw new Error('This signal is invalid or does not have uid or accountId.');
      const tps: number[] = [];
      const orders: MTResponse[] = [];
      for (const [key, value] of Object.entries(s.tps)) {
        if (!value || value === 'open') continue;
        logger.info(key)
        tps.push(value);
        continue;
      }
      const trailingOptions = {
        trailingStopLoss: { distance: { units: 'RELATIVE_PIPS', distance: s.stopLossPips } }
      };
      for (let i = 0; i < tps.length; i++) {
        const normSignal: MTForexSignal = {
          ...s, takeProfit: { units: 'ABSOLUTE_PRICE', value: tps[i]},
        };
        if (i > 0) {
          normSignal.marketOptions = trailingOptions;
          normSignal.pendingOptions = trailingOptions;
          normSignal.stopLimitOptions = trailingOptions;
        }
        logger.info('Handling order')
        let o = await handleForexOrder(normSignal);
        if (!o) throw new Error(`Unable to set order for user with id "${s.uid}" on account with id "${s.accountId}"`);
        orders.push({...o, tp: `tp${i + 1}`});
      }
      const id = s.signalId;
      const docRef = db.doc(
        `users/${s.uid}/fxAccounts/${s.accountId}/orders/${id}`
        );
        const doc = await docRef.get();
        const updates = [
          {
            time: new Date().getTime(),
            order: orders,
          },
        ];
        if (doc.exists) {
          const ups = doc.data()?.updates;
          if (!ups) continue;
          updates.push(ups);
        }
        batch.set(docRef, {
          signal: s,
          updates,
        }, { 
          merge: true,
        });
      }
    await batch.commit();
    return;
  } catch (error) {
    logger.error(error, 'sendSignalToAccounts');
    return;
  }
};
