import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { ExchangeSettingsComponent } from './components/exchange-settings/exchange-settings.component';
import { SelectExchangeComponent } from './components/select-exchange/select-exchange.component';
import { CryptoRoutingModule } from './crypto-routing.module';
import { CryptoComponent } from './crypto.component';



@NgModule({
  declarations: [
    CryptoComponent,
    SelectExchangeComponent,
    ExchangeSettingsComponent
  ],
  imports: [
    CommonModule,
		CryptoRoutingModule,
		ReactiveFormsModule,
		SharedModule,
  ]
})
export class CryptoModule { }
