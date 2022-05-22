import { Injectable } from '@angular/core';

interface MetaApiErrorResponse {
	code: number;
	name: string;
	client: string;
	dev: string;
	isErr: boolean | 'warn';
}

@Injectable({
  providedIn: 'root'
})
export class MetaApiErrorManagerService {

	handleError(code: number, error: string, msg: string) {
		const generic = 'C\'è stato un errore nel server, ho avvisato gli sviluppatori!';
		const res: MetaApiErrorResponse = {
			code: code,
			name: error,
			client: '',
			dev: msg,
			isErr: true,
		};

		switch (code) {
			case -9: // ERR_PIP_SIZE_NOT_DEFINED
				res.client = generic;
				res.isErr = true;
				break;
			case -8: // ERR_INVESTOR
				res.client = 'Hai impostato una password errata per il tuo account. Prova ad eliminarlo e ad aggiungerlo di nuovo.';
				res.isErr = true;
				break;
			case -7: // ERR_TRADE_TIMED_OUT
				res.client = generic;
				res.isErr = true;
				break;
			case -6: // ERR_NO_QUOTES
				res.client = generic;
				res.isErr = true;
				break;
			case -5: // ERR_NOT_SYNCHRONIZED
				res.client = generic;
				res.isErr = true;
				break;
			case -4: // TRADE_RETCODE_ORDER_TYPE_NOT_SUPPORTED
				res.client = 'Non sono riuscito a definire il tipo di ordine di questo segnale, ho avvisato gli sviluppatori.';
				res.isErr = true;
				break;
			case -1: // TRADE_RETCODE_UNKNOWN
				res.client = generic;
				res.isErr = true;
				break;
			case 4753: // ERR_TRADE_POSITION_NOT_FOUND
				res.client = 'Non sono riuscito a recuperare i dati di questa posizione, ho avvisato gli sviluppatori.';
				res.isErr = true;
				break;
			case 4754: // ERR_TRADE_ORDER_NOT_FOUND
				res.client = 'Non sono riuscito a recuperare i dati di questo ordine, ho avvisato gli sviluppatori.';
				res.isErr = true;
				break;
			case 10004: // TRADE_RETCODE_REQUOTE
				res.client = generic;
				res.isErr = true;
				break;
			case 10006: // TRADE_RETCODE_REJECT
				res.client = generic;
				res.isErr = true;
				break;
			case 10007: // TRADE_RETCODE_CANCEL
				res.client = generic;
				res.isErr = true;
				break;
			case 10008: // TRADE_RETCODE_PLACED
				res.client = 'Ordine piazzato con successo!';
				res.isErr = false;
				break;
			case 10009: // TRADE_RETCODE_DONE
				res.client = 'Ho aggiornato un paio di cosette!';
				res.isErr = false;
				break;
			case 10010: // TRADE_RETCODE_DONE_PARTIAL
				res.client = 'Ho piazzato solo parzialmente l\'ordine, potrebbe essere un problema di variazione troppo veloce dei prezzi.';
				res.isErr = 'warn';
				break;
			case 10011: // TRADE_RETCODE_ERROR
				res.client = 'C\'è stato un errore nel piazzare l\'ordine, ho avvisato gli sviluppatori.';
				res.isErr = true;
				break;
			case 10012: // TRADE_RETCODE_TIMEOUT
				res.client = generic;
				res.isErr = true;
				break;
			case 10013: // TRADE_RETCODE_INVALID
				res.client = generic;
				res.isErr = true;
				break;
			case 10014: // TRADE_RETCODE_INVALID_VOLUME
				res.client = generic;
				res.isErr = true;
				break;
			case 10015: // 	TRADE_RETCODE_INVALID_PRICE
				res.client = generic;
				res.isErr = true;
				break;
			case 10016: // TRADE_RETCODE_INVALID_STOPS
				res.client = generic;
				res.isErr = true;
				break;
			case 10017: // TRADE_RETCODE_TRADE_DISABLED
				res.client = 'Non mi è possibile fare Trading perchè è disabilitato dal Broker...';
				res.isErr = true;
				break;
			case 10018: // TRADE_RETCODE_MARKET_CLOSED
				res.client = 'Il mercato è chiuso al momento, non posso aprire il segnale.';
				res.isErr = true;
				break;
			case 10019: // TRADE_RETCODE_NO_MONEY
				res.client = 'Non ci sono fondi sufficienti sul tuo account per aprire questa operazione.';
				res.isErr = true;
				break;
			case 10020: // TRADE_RETCODE_PRICE_CHANGED
				res.client = generic;
				res.isErr = true;
				break;
			case 10021: // TRADE_RETCODE_PRICE_OFF
				res.client = generic;
				res.isErr = true;
				break;
			case 10022: // TRADE_RETCODE_INVALID_EXPIRATION
				res.client = generic;
				res.isErr = true;
				break;
			case 10023: // TRADE_RETCODE_ORDER_CHANGED
				res.client = 'Ho aggiornato l\'ordine con nuove informazioni.';
				res.isErr = false;
				break;
			case 10024: // TRADE_RETCODE_TOO_MANY_REQUESTS
				res.client = generic;
				res.isErr = true;
				break;
			case 10025: // TRADE_RETCODE_NO_CHANGES
				res.client = 'Ho aggiornato qualche piccolo dettaglio.';
				res.isErr = false;
				break;
			case 10026: // TRADE_RETCODE_SERVER_DISABLES_AT
				res.client = generic;
				res.isErr = true;
				break;
			case 10027: // TRADE_RETCODE_CLIENT_DISABLES_AT
				res.client = generic;
				res.isErr = true;
				break;
			case 10028: // TRADE_RETCODE_LOCKED
				res.client = generic;
				res.isErr = true;
				break;
			case 10029: // TRADE_RETCODE_FROZEN
				res.client = generic;
				res.isErr = true;
				break;
			case 10030: // TRADE_RETCODE_INVALID_FILL
				res.client = generic;
				res.isErr = true;
				break;
			case 10031: // TRADE_RETCODE_CONNECTION
				res.client = 'Non sono riuscito a collegarmi al server :(';
				res.isErr = true;
				break;
			case 10032: // TRADE_RETCODE_ONLY_REAL
				res.client = 'Questa operazione si può aprire solo su conti LIVE, non su conti DEMO.';
				res.isErr = true;
				break;
			case 10033: // TRADE_RETCODE_LIMIT_ORDERS
				res.client = 'Purtroppo non posso piazzare altri ordini pendenti.';
				res.isErr = true;
				break;
			case 10034: // TRADE_RETCODE_LIMIT_VOLUME
				res.client = 'Ho raggiunto il limite di operazioni che posso aprire su questo Mercato.';
				res.isErr = true;
				break;
			case 10035: // TRADE_RETCODE_INVALID_ORDER
				res.client = generic;
				res.isErr = true;
				break;
			case 10036: // TRADE_RETCODE_POSITION_CLOSED
				res.client = 'Ho chiuso manualmente questa operazione.';
				res.isErr = false;
				break;
			case 10038: // 	TRADE_RETCODE_INVALID_CLOSE_VOLUME
				res.client = 'Non sono riuscito a chiudere questa operazione, ma ho avvisato gli sviluppatori.';
				res.isErr = true;
				break;
			case 10039: // TRADE_RETCODE_CLOSE_ORDER_EXIST
				res.client = generic;
				res.isErr = true;
				break;
			case 10040: // TRADE_RETCODE_LIMIT_POSITIONS
				res.client = 'Il Broker non mi fa aprire altre nuove operazioni :(';
				res.isErr = true;
				break;
			case 10041: // TRADE_RETCODE_REJECT_CANCEL
				res.client = 'L\'ordine è stato cancellato, c\'è stato un piccolo errore, ma ho avvisato gli sviluppatori.';
				res.isErr = true;
				break;
			case 10042: // TRADE_RETCODE_LONG_ONLY
				res.client = 'Su questo mercato posso solo andare in Long...';
				res.isErr = true;
				break;
			case 10043: // TRADE_RETCODE_SHORT_ONLY
				res.client = 'Su questo mercato posso solo andare in Short...';
				res.isErr = true;
				break;
			case 10044: // TRADE_RETCODE_CLOSE_ONLY
				res.client = generic;
				res.isErr = true;
				break;
			case 10045: // TRADE_RETCODE_FIFO_CLOSE
				res.client = generic;
				res.isErr = true;
				break;
		
			default:
				break;
		}

		return res;
	};
	
}
