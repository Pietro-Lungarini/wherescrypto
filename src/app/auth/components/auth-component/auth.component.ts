import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	templateUrl: './auth.component.html',
	styleUrls: ['./auth.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthComponent implements OnInit, OnDestroy {

  showLoginBanner = false;
  showSignupBanner = false;
  destroyed$ = new Subject();

  constructor(private router: Router) { }

  ngOnInit(): void {
  	if (this.router.url.includes('/signup')) {
  		this.showLoginBanner = true;
  		this.showSignupBanner = false;
  	}
  	if (this.router.url.includes('/login')) {
  		this.showSignupBanner = true;
  		this.showLoginBanner = false;
  	}

  	this.router.events
  		.pipe(takeUntil(this.destroyed$))
  		.subscribe(event => {
  			if (this.router.url.includes('/signup')) {
  				this.showLoginBanner = true;
  				this.showSignupBanner = false;
  			}
  			if (this.router.url.includes('/login')) {
  				this.showSignupBanner = true;
  				this.showLoginBanner = false;
  			}
  		});
  }

  ngOnDestroy(): void {
  	this.destroyed$.next(true);
  	this.destroyed$.complete();
  }

}
