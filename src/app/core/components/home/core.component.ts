import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { IconNamesEnum } from 'ngx-bootstrap-icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/auth/services/authentication.service';
import { Avatar } from 'src/app/shared/components/avatar/avatar.component';
import { DropdownOptions } from 'src/app/shared/models/dropdown-options.model';
import { USER_NAV } from '../../../shared/ts/navigation';

@Component({
  selector: 'app-core',
  templateUrl: './core.component.html',
  styles: []
})
export class CoreComponent implements OnInit, OnDestroy {

	nav = USER_NAV;
	user: Avatar | undefined;
	destroyed = new Subject();
	profileMenuOpen = false;
	mobileMenuOpen = false;
	
	componentReference: any;
  childPageTitle = '';

	options: DropdownOptions[] = [
  	{
  		type: 'group',
  		childrens: [
  			{
  				name: 'Il mio account',
  				url: '/profile',
				},
				{
					name: 'Impostazioni',
					url: '/settings'
				}
  		]
  	},
  	{
  		name: 'Logout',
  		icon: IconNamesEnum.Power,
  		value: 'logout',
  		action: true
  	}
  ];

	constructor(
		private auth: AuthenticationService,
		private cdRef: ChangeDetectorRef
	) { }

	ngOnInit(): void {
		this.auth.user$
			.pipe(takeUntil(this.destroyed))
  		.subscribe(user => {
  			if (!user) return;
  			this.user = {
  				img: user.details?.imgUrl || '',
  				fullName: user.name || '',
  				email: user.email || '',
  				color: user.details?.imgColorBg || 'indigo'
  			};
  			this.cdRef.detectChanges();
			});
	}
	
	ngOnDestroy(): void {
		this.destroyed.next(true);
	}

	optClicked(option: DropdownOptions): void {
  	if (option.value === 'logout') this.auth.signOut();
	}
	
	routeChanged(componentRef: any): void {
  	if (!componentRef) return;
  	this.componentReference = componentRef;
  	this.childPageTitle = this.componentReference.pageTitle;
  }

}
