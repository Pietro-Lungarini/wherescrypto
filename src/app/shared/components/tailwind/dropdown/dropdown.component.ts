import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnInit,
	Output
} from '@angular/core';
import { IconNamesEnum } from 'ngx-bootstrap-icons';
import { DropdownOptions } from '../../../models/dropdown-options.model';


@Component({
	selector: 'app-dropdown',
	templateUrl: './dropdown.component.html',
	styles: [` :host { display: block; } `],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownComponent implements OnInit {

  @Output() isMenuOpen = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-on-prefix
  @Output() onOptionClicked = new EventEmitter();

  @Input() options: DropdownOptions[] | null = [
  	{
  		type: 'group',
  		childrens: [
  			{
  				url: '/',
  				name: 'Settings',
  			}
  		]
  	},
  	{
  		url: '/',
  		name: 'Logout',
  		icon: IconNamesEnum.HouseFill,
  	}
  ];
  @Input('isOpen') set setOpen(value: boolean) {
  	if (value === this.isOpen) return;
  	if (typeof value === 'boolean') this.toggleDropdown(value);
  }
  @Input() menuAddSpacing = 0;
  // eslint-disable-next-line max-len
  @Input() menuPosition: 'v-top-left' | 'v-top-right' | 'v-bottom-left' | 'v-bottom-right' | 'h-top-left' | 'h-top-right' | 'h-bottom-left' | 'h-bottom-right' = 'v-bottom-left';
  @Input() animDuration = 100;
  @Input() customOptions = false;
  @Input() closeOnOptionClick = false;
  @Input() overflowVisible = false;
  @Input() wFull = false;
  @Input() useFlex = false;

  isOpen = false;
  dropdownId = 'dropdown-';
  orientation: 'vertical' | 'horizontal' = 'vertical';
  positionClasses = '';
  transitionStarted = false;

  constructor(private eRef: ElementRef, private cdRef: ChangeDetectorRef) { }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
  	const isInNativeEl = this.eRef.nativeElement.contains(event.target);

  	if (
  		((this.closeOnOptionClick) ||
        (!this.closeOnOptionClick && !isInNativeEl)) &&
        this.isOpen
  	) {
  		this.transitionStarted = false;
  		this.toggleDropdown(false);
  	}
  }

  ngOnInit(): void {
  	this.initDropdownId();
  	this.initPositionClasses();
  }

  toggleDropdown(value?: boolean): void {
  	if (this.transitionStarted || !this.options) return;
  	this.isOpen = value !== undefined ? value : !this.isOpen;
  	this.isMenuOpen.emit(this.isOpen);
  	this.transitionStarted = true;
  	setTimeout(() => {
  		this.transitionStarted = false;
  		this.cdRef.detectChanges();
  	}, this.animDuration);
  }

  optionClicked(child: DropdownOptions, indexParent: number, indexChild?: number): void {
  	const option = {
  		...child,
  		indexParent,
  		indexChild: indexChild !== undefined ? indexChild : null
  	};
  	this.onOptionClicked.emit(option);
  	if (this.closeOnOptionClick)
  		this.toggleDropdown(false);
  }

  private initPositionClasses(): void {
  	switch (this.menuPosition) {
  	// Vertical
  	case 'v-top-left':
  		this.positionClasses = `origin-bottom-left bottom-0 ${'mb-' + (11 + this.menuAddSpacing)} left-0`;
  		this.orientation = 'vertical';
  		break;
  	case 'v-top-right':
  		this.positionClasses = `origin-bottom-right bottom-0 ${'mb-' + (11 + this.menuAddSpacing)} right-0`;
  		this.orientation = 'vertical';
  		break;
  	case 'v-bottom-right':
  		this.positionClasses = `origin-top-right ${'mt-' + (2 + this.menuAddSpacing)} right-0`;
  		this.orientation = 'vertical';
  		break;
  	case 'v-bottom-left':
  		this.positionClasses = `origin-top-left ${'mt-' + (2 + this.menuAddSpacing)} left-0`;
  		this.orientation = 'vertical';
  		break;

  		// Horizontal
  	case 'h-top-left':
  		this.positionClasses = `origin-bottom-right bottom-0 ${'-left-' + (24 + this.menuAddSpacing)}`;
  		this.orientation = 'horizontal';
  		break;
  	case 'h-top-right':
  		this.positionClasses = `origin-bottom-left bottom-0 ${'-right-' + (24 + this.menuAddSpacing)}`;
  		this.orientation = 'horizontal';
  		break;
  	case 'h-bottom-right':
  		this.positionClasses = `origin-top-left top-0 ${'-right-' + (24 + this.menuAddSpacing)}`;
  		this.orientation = 'horizontal';
  		break;
  	case 'h-bottom-left':
  		this.positionClasses = `origin-top-right top-0 ${'-left-' + (24 + this.menuAddSpacing)}`;
  		this.orientation = 'horizontal';
  		break;

  		// Default ('v-bottom-left')
  	default:
  		this.positionClasses = `origin-top-left ${'mt-' + (2 + this.menuAddSpacing)} left-0`;
  		this.orientation = 'vertical';
  		break;
  	}
  }

  private initDropdownId(): void {
  	if (!this.options) return;
  	let optLength = this.options.length;
  	let optLengthRes = this.options.length;
  	if (this.options.length > 0 && !!this.options) {
  		while (optLength--) {
  			optLengthRes++;
  			let length = this.options[optLength].childrens?.length;
  			if (!length || length <= 0) continue;
  			while (length--) {
  				optLengthRes++;
  			}
  		}
  	}
  	this.dropdownId += this.makeId(optLengthRes + 10);
  }

  private makeId(length: number): string {
  	let result = '';
  	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  	const charactersLength = characters.length;
  	while (length--) {
  		result += characters.charAt(Math.floor(Math.random() * charactersLength));
  	}
  	return result;
  }

}
