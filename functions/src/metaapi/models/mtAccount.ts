interface MTAccountPreferences {
  enabled: boolean;
  risk: number;
}

export interface MTAccount {
  name: string;
  login: number;
  password: string;
  uid: string;
  accountId?: string;
  platform: 'mt4' | 'mt5';
  server: 'live' | 'demo';
  channels: {
    commoditiesGamma: MTAccountPreferences,
    cryptoAlerts: MTAccountPreferences,
    fxIota: MTAccountPreferences,
    fxLds: MTAccountPreferences,
    fxLegacy: MTAccountPreferences,
    fxResistance: MTAccountPreferences,
  }
}