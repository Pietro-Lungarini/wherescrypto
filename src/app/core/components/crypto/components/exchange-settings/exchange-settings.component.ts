import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ExchangeInput } from 'src/app/shared/models/exchanges.model';

@Component({
  selector: 'app-exchange-settings',
  templateUrl: './exchange-settings.component.html',
	styles: [`
		:host {
			@apply flex flex-col justify-center items-center w-full h-full;
		}
	`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExchangeSettingsComponent implements OnInit {

	@Input() exchange: ExchangeInput | undefined;
	@Output() onSave = new EventEmitter();

	form = new FormGroup({
  	apiKey: new FormControl('', [Validators.required]),
  	secretKey: new FormControl('', [Validators.required]),
  	priority: new FormControl('', [Validators.required]),
  });

  constructor() { }

  ngOnInit(): void {
	}
	
	save(): void {
		this.onSave.emit();
	}

}
