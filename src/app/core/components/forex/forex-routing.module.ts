import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ForexComponent } from './forex.component';

const routes: Routes = [{ path: '', component: ForexComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ForexRoutingModule { }
