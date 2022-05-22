export interface ForexSignalSetup {
	cross: string;
	side?: 'buy' | 'sell';
	orderType: 'market' | 'limit';
	entry: number;
	sl: number;
	tp1: number;
	tp2?: number;
	tp3?: number;
}

export interface ForexSignal {
	id?: number;
	dbId?: string;
	date?: Date;
	channel: 'binaryAlpha' | 'binaryOmega' | 'binaryDelta' | 'cryptoAlerts' | 'fxLegacy' | 'fxResistance' | 'fxIota' | 'fxLds' | 'commoditiesAlpha' | 'commoditiesGamma' | 'wheresbebo';
	setup?: ForexSignalSetup;
	action?: 'cancel' | 'close-all' | 'partial-close' | 'signal-update' | 'break-eaven' | 'new';
	actionOptions?: {
		closeQty?: number
	};
	isValid: boolean;
}
