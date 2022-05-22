import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ForexRoutingModule } from './forex-routing.module';
import { ForexComponent } from './forex.component';


@NgModule({
  declarations: [
    ForexComponent
  ],
  imports: [
    CommonModule,
    ForexRoutingModule
  ]
})
export class ForexModule { }
