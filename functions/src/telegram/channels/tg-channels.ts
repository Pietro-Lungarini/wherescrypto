interface TGChannel {
	id: BigInt,
	shortName: 'binaryAlpha' | 'binaryOmega' | 'binaryDelta' | 'cryptoAlerts' | 'fxLegacy' | 'fxResistance' | 'fxIota' | 'fxLds' | 'commoditiesAlpha' | 'commoditiesGamma' | 'wheresbebo';
	name: string;
}

export const tgChannels: TGChannel[] = [
	// Binary Options
	{
		id: BigInt(1001759418543),
		shortName: 'binaryAlpha',
		name: 'BINARYpro: Alpha',
	},
	{
		id: BigInt(1001358882082),
		shortName: 'binaryOmega',
		name: 'BINARYpro: Omega',
	},
	{
		id: BigInt(1001600184639),
		shortName: 'binaryDelta',
		name: 'BINARYpro: Delta',
	},

	// Crypto
	{
		id: BigInt(1001169177929),
		shortName: 'cryptoAlerts',
		name: 'CRYPTOcore: Crypto Alerts',
	},

	// Forex
	{
		id: BigInt(1001647679353),
		shortName: 'fxLegacy',
		name: 'FXpro: Legacy',
	},
	{
		id: BigInt(1001703021121),
		shortName: 'fxResistance',
		name: 'FXpro: Resistance',
	},
	{
		id: BigInt(1001249834348),
		shortName: 'fxIota',
		name: 'FXpro: Iota',
	},
	{
		id: BigInt(1001206987929),
		shortName: 'fxLds',
		name: 'FXpro: Lds Trading',
	},

	// Commodities
	{
		id: BigInt(1001278254674),
		shortName: 'commoditiesAlpha',
		name: 'Commodities: Alpha',
	},
	{
		id: BigInt(1001675825364),
		shortName: 'commoditiesGamma',
		name: 'Commodities: Gamma',
	},

	// Test purpose only
	{
		id: BigInt(853325113),
		shortName: 'wheresbebo',
		name: 'wheresbebo',
	},
];
