import { config as env } from 'firebase-functions';
import MetaApi, { RpcMetaApiConnection } from 'metaapi.cloud-sdk';
import { logger } from '../utils/utils';
import { MTForexSignal } from './models/forexSignal.model';
import { MTAccount } from './models/mtAccount';

const token = env().metaapi.token;
const api = new MetaApi(token);
const mtApi = api.metatraderAccountApi;

const getMTAccount = async (accountId: string) => {
  try {
    return await mtApi.getAccount(accountId);
  } catch (error) {
    logger.error(error, 'forexSignal > getAccount');
    return;
  }
};

export const getAccountConnection = async (accountId: string) => {
  const account = await getMTAccount(accountId);
  if (!account) return;
  try {
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();
    return connection;
  } catch (error) {
    logger.error(error, 'MetaApi > getConnection');
    return;
  }
};

export const mtOrder = {
  buy: {
    market: async (c: RpcMetaApiConnection, s: MTForexSignal) => {
      return await c.createMarketBuyOrder(
        s.symbol[0],
        s.lot,
        s.stopLoss,
        s.takeProfit,
        s.marketOptions
      );
    },
    limit: async (c: RpcMetaApiConnection, s: MTForexSignal) => {
      return await c.createLimitBuyOrder(
        s.symbol[0],
        s.lot,
        s.openPrice,
        s.stopLoss,
        s.takeProfit,
        s.pendingOptions
      );
    },
    stop: async (c: RpcMetaApiConnection, s: MTForexSignal) => {
      return await c.createStopBuyOrder(
        s.symbol[0],
        s.lot,
        s.openPrice,
        s.stopLoss,
        s.takeProfit,
        s.pendingOptions
      );
    },
    stopLimit: async (c: RpcMetaApiConnection, s: MTForexSignal) => {
      return await c.createStopLimitBuyOrder(
        s.symbol[0],
        s.lot,
        s.openPrice,
        s.stopLoss,
        s.takeProfit,
        s.stopLimitOptions
      );
    },
  },
  sell: {
    market: async (c: RpcMetaApiConnection, s: MTForexSignal) => {
      return await c.createMarketSellOrder(
        s.symbol[0],
        s.lot,
        s.stopLoss,
        s.takeProfit,
        s.marketOptions
      );
    },
    limit: async (c: RpcMetaApiConnection, s: MTForexSignal) => {
      return await c.createLimitSellOrder(
        s.symbol[0],
        s.lot,
        s.openPrice,
        s.stopLoss,
        s.takeProfit,
        s.pendingOptions
      );
    },
    stop: async (c: RpcMetaApiConnection, s: MTForexSignal) => {
      return await c.createStopSellOrder(
        s.symbol[0],
        s.lot,
        s.openPrice,
        s.stopLoss,
        s.takeProfit,
        s.pendingOptions
      );
    },
    stopLimit: async (c: RpcMetaApiConnection, s: MTForexSignal) => {
      return await c.createStopLimitSellOrder(
        s.symbol[0],
        s.lot,
        s.openPrice,
        s.stopLoss,
        s.takeProfit,
        s.stopLimitOptions
      );
    },
  },
};

export const createMtAccount = async (user: MTAccount) => {
  logger.info('Creating new account', 'MetaApi > createMtAccount');
  try {
    const LIVE_SERVER = 'PacificUnionIntLLC-Live';
    const DEMO_SERVER = 'ErranteTrading-Demo';

    const account = await mtApi.createAccount({
      name: user.name,
      type: 'cloud',
      login: user.login + '',
      platform: user.platform,
      password: user.password,
      server: user.server === 'demo' ? DEMO_SERVER : LIVE_SERVER,
      application: 'MetaApi',
      magic: 26132980,
      quoteStreamingIntervalInSeconds: 2.5,
      manualTrades: false,
      reliability: 'regular',
      tags: ['active', 'wherescrypto'],
    });
    await account.deploy();
    return account;
  } catch (err: any) {
    // process errors
    if (err.details) {
      // returned if the server file for the specified server name has not been found
      // recommended to check the server name or create the account using a provisioning profile
      if (err.details === 'E_SRV_NOT_FOUND') {
        logger.error(err);
        return {
          err,
          suggest:
            'Check the server name or create the account using a provisioning profile.',
        };
        // returned if the server has failed to connect to the broker using your credentials
        // recommended to check your login and password
      } else if (err.details === 'E_AUTH') {
        logger.error(err);
        return {
          err,
          suggest: 'Check your login and password',
        };
        // returned if the server has failed to detect the broker settings
        // recommended to try again later or create the account using a provisioning profile
      } else if (err.details === 'E_SERVER_TIMEZONE') {
        logger.error(err);
        return {
          err,
          suggest:
            'Try again later or create the account using a provisioning profile',
        };
      }
    }

    logger.error(err, 'MetaApi > createMtAccount');
    return err;
  }
};
