import * as admin from 'firebase-admin';
import * as ffn from 'firebase-functions';
import { verifyClient } from './igenius/igenius';
import { sendSignalToAccounts } from './metaapi/handleForexOrder';
import { createMtAccount } from './metaapi/metaapi';
import { ForexSignal } from './models/forex-signal.model';
import { iGeniusRequestedUsers } from './models/igenius.model';
import { getTransactionUrl, setPubKey } from './store/store';
import { listenForTgMessages } from './telegram/telegram';

admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties: true });
const functions = ffn.region('europe-west2');

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

// Signals
exports.createMtAccount = functions.https.onCall(async (data) => {
  ffn.logger.info('Im running createMtAccount');
  ffn.logger.info(data);
  return await createMtAccount(data);
});
exports.convertGammaSignal = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '8GB',
  })
  .firestore.document('signals/commoditiesGamma/signals/{documentId}')
  .onWrite(async (change) => {
    // DELETED SIGNAL
    if (!change.after.exists) return;
    
    // NEW SIGNAL
    if (change.after.exists) { 
      const signal = change.after.data() as ForexSignal;
      await sendSignalToAccounts(signal);
      return;
    }
  });
exports.convertIotaSignal = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '8GB',
  })
  .firestore.document('signals/fxIota/signals/{documentId}')
  .onWrite(async (change) => {
    // DELETED SIGNAL
    if (!change.after.exists) return;
    
    // NEW SIGNAL
    if (change.after.exists) { 
      const signal = change.after.data() as ForexSignal;
      await sendSignalToAccounts(signal);
      return;
    }
  });
exports.convertLdsSignal = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '8GB',
  })
  .firestore.document('signals/fxLds/signals/{documentId}')
  .onWrite(async (change) => {
    // DELETED SIGNAL
    if (!change.after.exists) return;
    
    // NEW SIGNAL
    if (change.after.exists) { 
      const signal = change.after.data() as ForexSignal;
      await sendSignalToAccounts(signal);
      return;
    }
  });
exports.convertLegacySignal = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '8GB',
  })
  .firestore.document('signals/fxLegacy/signals/{documentId}')
  .onWrite(async (change) => {
    // DELETED SIGNAL
    if (!change.after.exists) return;
    
    // NEW SIGNAL
    if (change.after.exists) { 
      const signal = change.after.data() as ForexSignal;
      await sendSignalToAccounts(signal);
      return;
    }
  });
exports.convertResistanceSignal = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '8GB',
  })
  .firestore.document('signals/fxResistance/signals/{documentId}')
  .onWrite(async (change) => {
    // DELETED SIGNAL
    if (!change.after.exists) return;
    
    // NEW SIGNAL
    if (change.after.exists) { 
      const signal = change.after.data() as ForexSignal;
      await sendSignalToAccounts(signal);
      return;
    }
  });

// iGenius Verify Code
exports.verifyClient = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '4GB',
  })
  .https.onCall(async (data, ctx) => {
    const reqUser: iGeniusRequestedUsers = {
      date: new Date(),
      email: ctx.auth?.token.email,
      uid: ctx.auth?.token.uid,
      pip: ctx.auth?.token.picture,
    };
    return await verifyClient(data.id, reqUser);
  });

listenForTgMessages();

