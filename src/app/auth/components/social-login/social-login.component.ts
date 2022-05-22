import { Component } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';


@Component({
	selector: 'app-social-login',
	templateUrl: './social-login.component.html',
})
export class SocialLoginComponent {

	constructor(
    private db: AuthenticationService
	) {
	}

	googleLogin(): void {
		this.db.googleLogin();
	}

	facebookLogin(): void {
		this.db.facebookLogin();
	}

}
