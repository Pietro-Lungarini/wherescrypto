import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthenticationService } from '../services/authentication.service';



@Injectable({
	providedIn: 'root'
})
export class AuthGuard implements CanActivate {

	constructor(private auth: AuthenticationService, private router: Router) {}

	canActivate(route: any, state: RouterStateSnapshot): Observable<boolean> {
		return this.auth.user$.pipe(
			map(user => {
				if (user) return true;

				this.router.navigate(['/auth/login'], {
					queryParams: {
						returnUrl: state.url,
					}
				});
				return false;
			})
		);
	}
}
