import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';

export interface Avatar {
  img: string;
  fullName: string;
  email: string;
  color: 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink';
}

@Component({
	selector: 'app-avatar',
	templateUrl: './avatar.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent implements OnInit {

  @Input('user') set setUser(user: Avatar | undefined | null) {
		if (user) {
			user.img = user.img ? user.img : '';
			user.fullName = user.fullName ? user.fullName : '';
			user.email = user.email ? user.email : '';
			user.color = user.color ? user.color : 'indigo';
		}
		this.user = user ? user : this.placeholdUser;
		this.genInitials();
		this.initColor();
		this.initSizeClasses();
		this.cdRef.detectChanges();
	}
  @Input() displayType: 'card' | 'img' | 'raw' = 'card';
  @Input() enableProfileLink = true;
	@Input() imgMarginTopFix = false;
	@Input() showRing = false;

  placeholdUser: Avatar = {
  	img: '',
  	fullName: 'Pietro Lungarini',
  	email: 'pietro@lungarini.it',
  	color: 'indigo'
  };
	imgSize = 6;
	user: Avatar = this.placeholdUser;
	default = {
		standard: 'mx-auto object-cover rounded-full transition-all duration-300 ',
		flex: 'flex flex-col justify-center items-center mr-3 transition-all duration-300 '
	};
  classes1 = this.default.standard;
  classes2 = this.default.standard;
  classes3 = this.default.flex;
  initials: string | null = null;
  bgColor = '';

  constructor(private cdRef: ChangeDetectorRef) { }

  ngOnInit(): void {
  }

  genInitials(): void {
  	if (!this.user || !this.user.email || this.user.img) return;
  	const I1 =
      !this.user.fullName ?
      	this.user.email[0] :
      	this.user.fullName.split(' ')[0][0];

  	const I2 =
      !this.user.fullName ?
      	this.user.email[1] :
      	this.user.fullName.split(' ')[1][0];

  	this.initials = I1.toUpperCase() + I2.toUpperCase();
  }

  initColor(): void {
  	if (!this.user) return;
  	this.bgColor = ' bg-' + this.user.color + '-400 ';
  }

  initSizeClasses(): void {
  	this.classes1 = this.default.standard;
  	this.classes2 = this.default.standard;
  	this.classes3 = this.default.flex;
  	this.classes1 += 'h-' + (this.imgSize) + ' w-' + (this.imgSize);
  	this.classes2 += this.bgColor + ' h-' + (this.imgSize) + ' w-' + (this.imgSize);
  	this.classes3 += 'h-' + (this.imgSize) + ' w-' + (this.imgSize);
  }

}
