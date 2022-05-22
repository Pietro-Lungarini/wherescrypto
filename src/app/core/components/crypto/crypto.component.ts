import { Component, OnInit } from '@angular/core';
import { ExchangeInput } from 'src/app/shared/models/exchanges.model';

@Component({
  selector: 'app-crypto',
  templateUrl: './crypto.component.html',
  styleUrls: ['./crypto.component.scss']
})
export class CryptoComponent implements OnInit {

	pageTitle = 'Crypto';
	exchange: ExchangeInput | undefined;

	// Transition
	transitionStarted = false;
  show = false;
	hide = true;
	hideSelect = false;

  constructor() { }

  ngOnInit(): void {
	}
	
	selectExchange(exchange?: ExchangeInput): void {
		if (!exchange) return;
		console.log('Exchange Selected:', exchange);
		this.exchange = exchange;
		this.toggleSettings(true);
	}

	closeSettings(): void {
		this.toggleSettings(false);
	}

	private toggleSettings(value: boolean): void {
		/* debugger; */
  	if (this.transitionStarted) return;
  	this.transitionStarted = true;
		if (value === true) this.hide = false;
		this.show = value;
		console.log(this.show);
		setTimeout(() => {
			/* debugger; */
			this.transitionStarted = false;
			if (value === false) this.hide = true;
			this.hideSelect = value;
  	}, 700);
	}

}
