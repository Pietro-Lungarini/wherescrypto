import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ExchangeInput } from 'src/app/shared/models/exchanges.model';


@Component({
  selector: 'app-select-exchange',
  templateUrl: './select-exchange.component.html',
  styles: [`
		:host {
			@apply flex flex-col justify-center items-center w-full h-full;
		}
	`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectExchangeComponent implements OnInit {

	@Output() onClick = new EventEmitter();

	logoBaseUrl = 'assets/logo/exchanges/';
	exchanges: ExchangeInput[] = [
		{ id: 'Binance', logo: this.logoBaseUrl + 'binance_logo.svg', available: true },
		{ id: 'KuCoin', logo: this.logoBaseUrl + 'kucoin_logo.svg', available: false },
		{ id: 'Huobi', logo: this.logoBaseUrl + 'huobi_logo.svg', available: false },
	];

  constructor() { }

  ngOnInit(): void {
  }

}
