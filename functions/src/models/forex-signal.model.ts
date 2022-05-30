import { Timestamp } from './timestamp.model';

export interface ForexSignalSetup {
  cross: string;
  side?: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop';
  entry: number;
  sl: number;
  tp1: number | 'open';
  tp2?: number | 'open';
  tp3?: number | 'open';
  tp4?: number | 'open';
  tp5?: number | 'open';
}

export interface ForexSignal {
  id?: number;
  dbId?: string;
  date?: Date;
  channel:
    | 'binaryAlpha'
    | 'binaryOmega'
    | 'binaryDelta'
    | 'cryptoAlerts'
    | 'fxLegacy'
    | 'fxResistance'
    | 'fxIota'
    | 'fxLds'
    | 'commoditiesAlpha'
    | 'commoditiesGamma'
    | 'wheresbebo';
  setup?: ForexSignalSetup;
  action?: (
    | 'cancel'
    | 'close-all'
    | 'partial-close'
    | 'signal-update'
    | 'break-even'
    | 'move-sl'
    | 'new'
  )[];
  actionOptions?: {
    closeQty?: number;
    moveSl?: 'entry' | 'tp' | 'tp1' | 'tp2' | 'tp3' | 'tp4' | 'tp5' | number;
  };
  isValid: boolean;
  updatedAt?: Timestamp | Date;
  createdAt?: Timestamp | Date;
}
