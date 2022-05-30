export interface MTAccount {
	name: string;
	login: number;
	password: string;
	platform: 'mt4' | 'mt5';
	server: 'live' | 'demo';
}