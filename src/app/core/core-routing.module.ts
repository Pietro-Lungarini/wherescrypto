import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CoreComponent } from './components/home/core.component';

const routes: Routes = [
	{
		path: '',
		component: CoreComponent,
		children: [
			{ path: '', component: DashboardComponent },
			{ path: 'crypto', loadChildren: () => import('./components/crypto/crypto.module').then(m => m.CryptoModule) },
			{ path: 'forex', loadChildren: () => import('./components/forex/forex.module').then(m => m.ForexModule) },
			{ path: 'edu', loadChildren: () => import('./components/education/education.module').then(m => m.EducationModule) },
			{ path: 'events', loadChildren: () => import('./components/events/events.module').then(m => m.EventsModule) },
		]
	}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoreRoutingModule { }
