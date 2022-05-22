import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AuthenticationService } from '../../services/authentication.service';


@Injectable({
	providedIn: 'root'
})
export class AdminGuard implements CanActivate {

	constructor(private auth: AuthenticationService, private router: Router) {}

	canActivate(
		next: ActivatedRouteSnapshot,
		state: RouterStateSnapshot): Observable<boolean> {

		return this.auth.user$.pipe(
			take(1),
			map(user => user && user.roles?.admin ? true : false),
			tap(isAdmin => {
				if (!isAdmin) {
					console.error('Access denied - Admins only');
					localStorage.setItem('notAdminError', 'true');
					this.router.navigate(['/dashboard']);
				}
			})
		);
	}
}
