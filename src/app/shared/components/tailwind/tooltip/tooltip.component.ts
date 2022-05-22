import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';



@Component({
	selector: 'app-tooltip',
	templateUrl: './tooltip.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipComponent implements OnInit {

  @Input() text = '';
  @Input() tooltipAddSpacing: 0 | 1 | 3 | 5 | 9 | 13 | 17 | 21 | 25 = 0;
  // eslint-disable-next-line max-len
  @Input() tooltipPosition: 'v-top-left' | 'v-top-right' | 'v-top-center' | 'v-bottom-left' | 'v-bottom-right' | 'v-bottom-center' | 'h-top-left' | 'h-top-right' | 'h-bottom-left' | 'h-bottom-right' | 'h-center-right' | 'h-center-left' = 'v-top-center';
  @Input() animDuration = 100;
  @Input() isHtml = false;
  @Input() overrideShow = false;

  isOpen = false;
  tooltipId = 'tooltip-';
  orientation: 'vertical' | 'horizontal' = 'vertical';
  positionClasses = '';
  transitionStarted = false;

  constructor() { }

  ngOnInit(): void {
  	this.initTooltipId();
  	this.initPositionClasses();
  }

  toggleTooltip(value: boolean): void {
  	if (this.transitionStarted || !this.text) return;
  	this.isOpen = value;
  	this.transitionStarted = true;
  	setTimeout(() => {
  		this.transitionStarted = false;
  	}, 100);
  }

  private initPositionClasses(): void {
  	switch (this.tooltipPosition) {
  	// Vertical
  	case 'v-top-left':
  		this.positionClasses = `origin-bottom-left bottom-0 ${'mb-' + (11 + this.tooltipAddSpacing)} left-0`;
  		this.orientation = 'vertical';
  		break;
  	case 'v-top-right':
  		this.positionClasses = `origin-bottom-right bottom-0 ${'mb-' + (11 + this.tooltipAddSpacing)} right-0`;
  		this.orientation = 'vertical';
  		break;
  	case 'v-top-center':
  		this.positionClasses = `origin-center bottom-0 ${'mb-' + (11 + this.tooltipAddSpacing)} -translate-x-1/2 -inset-x-1/2`;
  		this.orientation = 'vertical';
  		break;
  	case 'v-bottom-right':
  		this.positionClasses = `origin-top-right ${'mt-' + (2 + this.tooltipAddSpacing)} right-0`;
  		this.orientation = 'vertical';
  		break;
  	case 'v-bottom-left':
  		this.positionClasses = `origin-top-left ${'mt-' + (2 + this.tooltipAddSpacing)} left-0`;
  		this.orientation = 'vertical';
  		break;
  	case 'v-bottom-center':
  		this.positionClasses = `origin-center top-0 ${'mt-' + (11 + this.tooltipAddSpacing)} -translate-x-1/2 -inset-x-1/2`;
  		this.orientation = 'vertical';
  		break;

  		// Horizontal
  	case 'h-top-left':
  		this.positionClasses = `origin-bottom-right bottom-0 ${'-left-' + (24 + this.tooltipAddSpacing)}`;
  		this.orientation = 'horizontal';
  		break;
  	case 'h-top-right':
  		this.positionClasses = `origin-bottom-left bottom-0 ${'-right-' + (24 + this.tooltipAddSpacing)}`;
  		this.orientation = 'horizontal';
  		break;
  	case 'h-bottom-right':
  		this.positionClasses = `origin-top-left top-0 ${'-right-' + (24 + this.tooltipAddSpacing)}`;
  		this.orientation = 'horizontal';
  		break;
  	case 'h-bottom-left':
  		this.positionClasses = `origin-top-right top-0 ${'-left-' + (24 + this.tooltipAddSpacing)}`;
  		this.orientation = 'horizontal';
  		break;
  	case 'h-center-right':
  		this.positionClasses = `origin-left top-1/2 ${'-right-' + (20 + this.tooltipAddSpacing)} -translate-y-1/2`;
  		this.orientation = 'horizontal';
  		break;
  	case 'h-center-left':
  		this.positionClasses = `origin-right top-1/2 ${'-left-' + (20 + this.tooltipAddSpacing)} -translate-y-1/2`;
  		this.orientation = 'horizontal';
  		break;

  		// Default ('v-bottom-left')
  	default:
  		this.positionClasses = `origin-top-left ${'mt-' + (2 + this.tooltipAddSpacing)} left-0`;
  		this.orientation = 'vertical';
  		break;
  	}
  }

  private initTooltipId(): void {
  	if (!this.text) return;
  	let strLength = this.text.length;
  	let strLengthRes = this.text.length;
  	if (this.text.length > 0 && !!this.text) {
  		while (strLength--) {
  			strLengthRes++;
  		}
  	}
  	this.tooltipId += this.makeId(strLengthRes + 10);
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
