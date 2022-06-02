import { ForexSignal } from '../models/forex-signal.model';
import { logger } from '../utils/utils';
import { getAccountConnection, mtOrder } from './metaapi';
import { MTForexSignal } from './models/forexSignal.model';
import { firestore } from 'firebase-admin';
import { MTAccount } from './models/mtAccount';
import { MetatraderTradeResponse, PendingTradeOptions } from 'metaapi.cloud-sdk';

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

const getRisk = async (
  uid: string,
  accountId: string,
  channel: string,
): Promise<{
  risk: number,
  maxRisk: number,
} | undefined> => {
  try {
    const db = firestore();
    const docRef = db.doc(`users/${uid}/fxAccounts/${accountId}`);
    const doc = await docRef.get();
    if (!doc.exists) return;
    const data = doc.data();
    if (!data) return;
    const maxRisk = data.maxRisk || 0.20;
    const isEnabled = data.channels[channel].enabled;
    if (!isEnabled) return;
    const risk = data.channels[channel].risk;
    return { risk: risk as number, maxRisk };
  } catch (error) {
    logger.error(error, 'getChannelRisk');
    return;
  }
};

const getSignalLot = async (
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
    const risk = await getRisk(uid, accountId, signal.channel);
    if (typeof risk?.risk !== 'number') return invalidRes;
    const account = await getAccountConnection(accountId);
    const info = await account?.getAccountInformation();
    if (!info) return invalidRes;
    const maxRiskBalance = info.balance - (info.balance * risk.maxRisk);
    const balance = info.freeMargin;
    if (balance < maxRiskBalance) return invalidRes;
    const accCurr = info.currency;
    const entry = signal.setup.entry;
    const sl = signal.setup.sl;
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
      exchangeRate = 1;
    } else {
      const exRatePrice = await account?.getSymbolPrice(
        accCurr + quoteCurr,
        false
      );
      if (!exRatePrice) return invalidRes;
      exchangeRate = parseFloat(exRatePrice?.bid);
    }
    const balanceAtRisk = balance * risk.risk;
    const contractSize = symbol.contractSize;
    const digits = symbol.digits <= 2 ? 2 : symbol.digits - 1;
    const pipSize = symbol.pipSize || 0;
    const slInPips = Math.round(Math.abs(entry - sl) / pipSize);
    const perPip = (balanceAtRisk * exchangeRate) / slInPips;
    const multiplier = Math.pow(10, digits);
    const positionSize = perPip * multiplier;
    const normPositionSize = positionSize / tpCounts;

    const lot = normPositionSize / contractSize; // LOT SIZE

    if (lot < minLot) return invalidRes;

    const roundLot = (lot: number, min: number, step: number) => {
      const a = Math.ceil((lot - min) / step) * step + min;
      return parseFloat(a.toFixed(3));
    };

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
  const { lot, slPips } = await getSignalLot(uid, accountId, signal);
  if (!lot || lot === 0) return;
  return {
    channel: signal.channel,
    actions: signal.action,
    actionOptions: signal.actionOptions,
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

const getOrdersOfSignal = async (signal: MTForexSignal) => {
  const db = firestore();
  const ids: string[] = [];
  const docRef = db.doc(`users/${signal.uid}/fxAccounts/${signal.accountId}/orders/${signal.signalId}`);
  const doc = await docRef.get();

  if (!doc.exists) return;

  const order = doc.data();
  const updates = order?.updates as any[]; // TO TYPE

  updates.forEach((update) => {
    const orders = update.orders as any[];
    orders.forEach((o) => {
      ids.push(o.orderId);
    })
  });

  const account = await getAccountConnection(signal.accountId);
  if (!account) return;

  const positionsToEdit: {id: string, tag: 'position' | 'order'}[] = [];
  const ordersToEdit: {id: string, tag: 'position' | 'order'}[] = [];

  const positions = await account.getPositions();
  positions.forEach((p) => {
    if (ids.includes(p.id.toString())) {
      positionsToEdit.push({ id: p.id.toString(), tag: 'position' });
    }
  });

  const orders = await account.getOrders();
  orders.forEach((o) => {
    if (ids.includes(o.id.toString())) {
      positionsToEdit.push({ id: o.id.toString(), tag: 'position' });
    }
  });

  return positionsToEdit.concat(ordersToEdit);
}

const openMTOrder = async (batch: firestore.WriteBatch, signal?: MTForexSignal) => {
  if (!signal || !signal.uid || !signal.accountId || !signal.tps) throw new Error('This signal is invalid or does not have uid or accountId.');
  const tps: number[] = [];
  const orders: MTResponse[] = [];
  for (const [key, value] of Object.entries(signal.tps)) {
    if (!value || value === 'open') continue;
    logger.info(key)
    tps.push(value);
    continue;
  }
  const customOptions: PendingTradeOptions = {
    trailingStopLoss: { distance: { units: 'RELATIVE_PIPS', distance: signal.stopLossPips } },
    comment: signal.channel,
  };
  for (let i = 0; i < tps.length; i++) {
    const normSignal: MTForexSignal = {
      ...signal, takeProfit: { units: 'ABSOLUTE_PRICE', value: tps[i]},
    };
    if (i > 0) {
      normSignal.marketOptions = customOptions;
      normSignal.pendingOptions = customOptions;
      normSignal.stopLimitOptions = customOptions;
    }
    logger.info('Handling order');
    let o = await handleForexOrder(normSignal);
    if (!o) throw new Error(`Unable to set order for user with id "${signal.uid}" on account with id "${signal.accountId}"`);
    orders.push({...o, tp: `tp${i + 1}`});
  }
  const id = signal.signalId;
  const db = firestore();
  const docRef = db.doc(
    `users/${signal.uid}/fxAccounts/${signal.accountId}/orders/${id}`
  );
  const doc = await docRef.get();
  const updates = [
    {
      time: new Date().getTime(),
      orders,
    },
  ];
  if (doc.exists) {
    const ups = doc.data()?.updates;
    if (!ups) return;
    updates.push(ups);
  }
  batch.set(docRef, {
    signal: signal,
    updates,
  }, { 
    merge: true,
  });
    
};

const updatePosition = {
  cancel: async (signal: MTForexSignal) => {
    const db = firestore();
    const batch = db.batch();
    const orders = await getOrdersOfSignal(signal);
    if (!orders || orders.length <= 0) return;
    const promises: Promise<void>[] = [];
    const responses: MetatraderTradeResponse[] = [];
    const updateOrder = async (id: string, tag: 'position' | 'order') => {
      const account = await getAccountConnection(signal.accountId);
      if (!account) return;
      let res;
      if (tag === 'order') {
        res = await account.cancelOrder(id);
      } else {
        res = await account.closePosition(id, {});
      }
      responses.push(res);
    }

    orders.forEach((o) => {
      promises.push(updateOrder(o.id, o.tag));
    })


    const docRef = db.doc(
      `users/${signal.uid}/fxAccounts/${signal.accountId}/orders/${signal.signalId}`
    );
    const doc = await docRef.get();
    const updates = [
      {
        time: new Date().getTime(),
        orders: responses,
      },
    ];
    if (doc.exists) {
      const ups = doc.data()?.updates;
      if (!ups) return;
      updates.push(ups);
    }
    batch.set(docRef, {
      signal: signal,
      updates,
    }, { 
      merge: true,
    });

    await Promise.all(promises);
    await batch.commit();
  },
  closeAll: async (signal: MTForexSignal) => {
    return updatePosition.cancel(signal);
  },
  partialClose: async (signal: MTForexSignal) => {
    const db = firestore();
    const batch = db.batch();
    const orders = await getOrdersOfSignal(signal);
    if (!orders || orders.length <= 0) return;
    const promises: Promise<void>[] = [];
    const responses: MetatraderTradeResponse[] = [];
    const updateOrder = async (id: string, tag: 'position' | 'order') => {
      const account = await getAccountConnection(signal.accountId);
      if (!account) return;
      let res;
      if (tag === 'order') {
        res = await account.cancelOrder(id);
      } else {
        res = await account.closePosition(id, {});
      }
      responses.push(res);
      
    }

    const lengthsToClose = Math.ceil(orders.length * (signal.actionOptions?.closeQty || 1));
    orders.forEach((o, i) => {
      if (i < lengthsToClose)
        promises.push(updateOrder(o.id, o.tag));
    })

    const docRef = db.doc(
      `users/${signal.uid}/fxAccounts/${signal.accountId}/orders/${signal.signalId}`
    );
    const doc = await docRef.get();
    const updates = [
      {
        time: new Date().getTime(),
        orders: responses,
      },
    ];
    if (doc.exists) {
      const ups = doc.data()?.updates;
      if (!ups) return;
      updates.push(ups);
    }
    batch.set(docRef, {
      signal: signal,
      updates,
    }, { 
      merge: true,
    });

    await Promise.all(promises);
    await batch.commit();
  },
  signalUpdate: async (signal: MTForexSignal) => {
    const db = firestore();
    const batch = db.batch();
    const orders = await getOrdersOfSignal(signal);
    if (!orders || orders.length <= 0) return;
    const promises: Promise<void>[] = [];
    const responses: MetatraderTradeResponse[] = [];
    const updateOrder = async (id: string, tag: 'position' | 'order') => {
      const account = await getAccountConnection(signal.accountId);
      if (!account) return;
      let res;
      if (tag === 'order') {
        res = await account.modifyOrder(id, signal.openPrice, signal.stopLoss, signal.takeProfit);
      } else {
        res = await account.modifyPosition(id, signal.stopLoss, signal.takeProfit);
      }
      responses.push(res);
    }

    orders.forEach((o, i) => {
      promises.push(updateOrder(o.id, o.tag));
    })

    const docRef = db.doc(
      `users/${signal.uid}/fxAccounts/${signal.accountId}/orders/${signal.signalId}`
    );
    const doc = await docRef.get();
    const updates = [
      {
        time: new Date().getTime(),
        orders: responses,
      },
    ];
    if (doc.exists) {
      const ups = doc.data()?.updates;
      if (!ups) return;
      updates.push(ups);
    }
    batch.set(docRef, {
      signal: signal,
      updates,
    }, { 
      merge: true,
    });

    await Promise.all(promises);
    await batch.commit();
  },
  breakEven: async (signal: MTForexSignal) => {
    const db = firestore();
    const batch = db.batch();
    const orders = await getOrdersOfSignal(signal);
    if (!orders || orders.length <= 0) return;
    const promises: Promise<void>[] = [];
    const responses: MetatraderTradeResponse[] = [];
    const updateOrder = async (id: string, tag: 'position' | 'order') => {
      const account = await getAccountConnection(signal.accountId);
      if (!account) return;
      let res;
      if (tag === 'order') {
        res = await account.modifyOrder(id, signal.openPrice, signal.stopLoss, signal.takeProfit);
      } else {
        res = await account.modifyPosition(id, signal.openPrice, signal.takeProfit);
      }
      responses.push(res);
    }

    orders.forEach((o, i) => {
      promises.push(updateOrder(o.id, o.tag));
    })

    const docRef = db.doc(
      `users/${signal.uid}/fxAccounts/${signal.accountId}/orders/${signal.signalId}`
    );
    const doc = await docRef.get();
    const updates = [
      {
        time: new Date().getTime(),
        orders: responses,
      },
    ];
    if (doc.exists) {
      const ups = doc.data()?.updates;
      if (!ups) return;
      updates.push(ups);
    }
    batch.set(docRef, {
      signal: signal,
      updates,
    }, { 
      merge: true,
    });

    await Promise.all(promises);
    await batch.commit();
  },
  moveSl: async (signal: MTForexSignal) => {
    const db = firestore();
    const batch = db.batch();
    const orders = await getOrdersOfSignal(signal);
    if (!orders || orders.length <= 0) return;
    const promises: Promise<void>[] = [];
    const responses: MetatraderTradeResponse[] = [];
    const updateOrder = async (id: string, tag: 'position' | 'order') => {
      const account = await getAccountConnection(signal.accountId);
      if (!account) return;
      let res;
      const slTo = () => {
        const to = signal.actionOptions?.moveSl;
        if (!to) return;
        switch (to) {
          case 'entry':
            return signal.openPrice;
          case ('tp' || 'tp1'):
            return signal.tps?.tp1;
          case 'tp2':
            return signal.tps?.tp2;
          case 'tp3':
            return signal.tps?.tp3;
          case 'tp4':
            return signal.tps?.tp4;
          case 'tp5':
            return signal.tps?.tp5;
        
          default:
            return;
        }
      }
      const toSl = slTo();
      if (typeof toSl !== 'number') return;
      if (tag === 'order') {
        res = await account.modifyOrder(id, signal.openPrice, toSl, signal.takeProfit);
      } else {
        res = await account.modifyPosition(id, toSl, signal.takeProfit);
      }
      responses.push(res);
    }

    orders.forEach((o, i) => {
      promises.push(updateOrder(o.id, o.tag));
    })

    const docRef = db.doc(
      `users/${signal.uid}/fxAccounts/${signal.accountId}/orders/${signal.signalId}`
    );
    const doc = await docRef.get();
    const updates = [
      {
        time: new Date().getTime(),
        orders: responses,
      },
    ];
    if (doc.exists) {
      const ups = doc.data()?.updates;
      if (!ups) return;
      updates.push(ups);
    }
    batch.set(docRef, {
      signal: signal,
      updates,
    }, { 
      merge: true,
    });

    await Promise.all(promises);
    await batch.commit();
  },
}

const redirectToUpdate = async (signal: MTForexSignal) => {
  if (signal.actions?.includes('cancel')) await updatePosition.cancel(signal);
  if (signal.actions?.includes('break-even')) await updatePosition.breakEven(signal);
  if (signal.actions?.includes('close-all')) await updatePosition.closeAll(signal);
  if (signal.actions?.includes('move-sl')) await updatePosition.moveSl(signal);
  if (signal.actions?.includes('partial-close')) await updatePosition.partialClose(signal);
  if (signal.actions?.includes('signal-update')) await updatePosition.signalUpdate(signal);
  return;
}

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
        if (!channel || !channel.enabled) throw new Error(`Haven't found any enabled channel on user with id "${a.uid}" in account with id "${a.accountId}".`);
        signalsPromises.push(forexSignalToMT(signal, a.accountId, a.uid, channel.trailingStop));
      });
    });
    const signals = await Promise.all(signalsPromises);
    
    const batch = db.batch();
    const ordersSignal: Promise<void>[] = []
    for (const s of signals) {
      if (!s) return;
      if (!s.actions || s.actions?.includes('new')) {
        ordersSignal.push(openMTOrder(batch, s));
      } else {
        return redirectToUpdate(s);
      }
    }
    await Promise.all(ordersSignal);
    await batch.commit();
    return;
  } catch (error) {
    logger.error(error, 'sendSignalToAccounts');
    return;
  }
};

