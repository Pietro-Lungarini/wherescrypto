interface TGChannel {
	id: BigInt,
	shortName: 'binaryAlpha' | 'binaryOmega' | 'binaryDelta' | 'cryptoAlerts' | 'fxLegacy' | 'fxResistance' | 'fxIota' | 'fxLds' | 'commoditiesAlpha' | 'commoditiesGamma' | 'wheresbebo';
	name: string;
	available: boolean;
}

export const tgChannels: TGChannel[] = [
	// Binary Options
	{
		id: BigInt(1001759418543),
		shortName: 'binaryAlpha',
		name: 'BINARYpro: Alpha',
		available: false,
	},
	{
		id: BigInt(1001358882082),
		shortName: 'binaryOmega',
		name: 'BINARYpro: Omega',
		available: false,
	},
	{
		id: BigInt(1001600184639),
		shortName: 'binaryDelta',
		name: 'BINARYpro: Delta',
		available: false,
	},

	// Crypto
	{
		id: BigInt(1001169177929),
		shortName: 'cryptoAlerts',
		name: 'CRYPTOcore: Crypto Alerts', 
		available: true,
	},

	// Forex
	{
		id: BigInt(1001647679353),
		shortName: 'fxLegacy',
		name: 'FXpro: Legacy',
		available: true,
	},
	{
		id: BigInt(1001703021121),
		shortName: 'fxResistance',
		name: 'FXpro: Resistance',
		available: false,
	},
	{
		id: BigInt(1001249834348),
		shortName: 'fxIota',
		name: 'FXpro: Iota',
		available: true,
	},
	{
		id: BigInt(1001206987929),
		shortName: 'fxLds',
		name: 'FXpro: Lds Trading',
		available: true,
	},

	// Commodities
	{
		id: BigInt(1001278254674),
		shortName: 'commoditiesAlpha',
		name: 'Commodities: Alpha',
		available: true,
	},
	{
		id: BigInt(1001675825364),
		shortName: 'commoditiesGamma',
		name: 'Commodities: Gamma',
		available: true,
	},

	// Test purpose only
	{
		id: BigInt(853325113),
		shortName: 'wheresbebo',
		name: 'wheresbebo',
		available: true,
	},
];
