import { NgModule } from '@angular/core';
import { ExtraOptions, PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';

const routes: Routes = [
	{
		path: 'auth',
		loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
	},
	{
		path: '',
		canActivate: [AuthGuard],
		loadChildren: () => import('./core/core.module').then(m => m.CoreModule)
	},


	// Redirects
	{
		path: 'login',
		redirectTo: 'auth/login'
	},
	{
		path: 'signup',
		redirectTo: 'auth/signup'
	},
];

const routerOptions: ExtraOptions = {
	/* enableTracing: true, */
	preloadingStrategy: PreloadAllModules,
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
