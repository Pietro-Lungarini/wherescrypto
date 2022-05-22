import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CryptoPlaceholderComponent } from './components/placeholders/crypto-placeholder/crypto-placeholder.component';
import { ForexPlaceholderComponent } from './components/placeholders/forex-placeholder/forex-placeholder.component';
import { OrdersPlaceholderComponent } from './components/placeholders/orders-placeholder/orders-placeholder.component';
import { CoreComponent } from './components/home/core.component';
import { CoreRoutingModule } from './core-routing.module';



@NgModule({
  declarations: [
		CoreComponent,
		DashboardComponent,
		CryptoPlaceholderComponent,
		ForexPlaceholderComponent,
		OrdersPlaceholderComponent
  ],
  imports: [
    CommonModule,
		CoreRoutingModule,
		SharedModule,
  ]
})
export class CoreModule { }
