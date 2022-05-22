import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './components/auth-component/auth.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';

const routes: Routes = [
	{
		path: '',
		component: AuthComponent,
		children: [
			{
				path: 'login',
				component: LoginComponent
			},
			{
				path: 'email/action',
				component: ForgotPasswordComponent
			},
			{
				path: 'reset/new-password',
				component: ForgotPasswordComponent
			},
			{
				path: 'signup',
				component: SignupComponent
			},
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'login'
			}
		]
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class AuthRoutingModule { }
