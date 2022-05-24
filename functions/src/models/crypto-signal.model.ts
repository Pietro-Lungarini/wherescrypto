import { Timestamp } from "./timestamp.model";

export interface CryptoSignalExchanges extends Array<string> {
  [index: number]:
    | 'Binance'
    | 'KuCoin'
    | 'Huobi'
    | 'UniSwap'
    | 'MEXC'
    | 'FTX'
    | 'Hoo.com'
    | 'Ascendex'
    | 'Bittrex'
    | 'Raydium'
    | 'Gate.io'
    | 'Coinbase'
    | 'PancakeSwap'
    | 'Kraken';
}

export interface CryptoSignalMargin {
  hasMargin?: boolean;
  margin?: number;
}

export interface CryptoSignalStopLoss {
  price?: string;
  currency?: 'USD' | 'BTC' | 'USDT';
  isValid?: boolean;
  tbd?: boolean;
}

export interface CryptoSignalTarget {
  id?: number;
  price?: string;
  currency?: 'USD' | 'BTC' | 'USDT';
  quantity?: number;
  tbd?: boolean;
}

export interface CryptoSignalEntry {
  orderType?: 'buy-limit' | 'buy-market' | 'sell-limit' | 'sell-market';
  price?: string;
  currency?: 'USD' | 'BTC' | 'USDT';
}

export interface CryptoSignalSetup {
  pair?: string;
  entry?: CryptoSignalEntry;
  safeEntry?: CryptoSignalEntry;
  aggressiveEntry?: CryptoSignalEntry;
  currency?: 'USD' | 'BTC' | 'USDT';
  targets?: CryptoSignalTarget[];
  shadTargets?: CryptoSignalTarget[];
  position?: number;
  stopLoss?: CryptoSignalStopLoss;
  risk?: number;
  margin?: CryptoSignalMargin;
  exchanges?: CryptoSignalExchanges;
}

export interface CryptoSignal {
  id?: number;
	dbId?: string;
	date?: Date;
  signalType?:
    | 'update'
    | 'investment'
    | 'ma-investment'
    | 'shad-strategy'
    | 'mt-trading'
    | 'general-analysis'
    | 'signal';
  author: 'futures-signals' | 'crypto-alerts' | 'undefined';
  notes?: string;
  setup?: CryptoSignalSetup;
  isValid: boolean;
  updatedAt?: Timestamp | Date;
  createdAt?: Timestamp | Date;
}
