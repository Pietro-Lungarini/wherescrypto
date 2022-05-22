import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { allIcons, NgxBootstrapIconsModule } from 'ngx-bootstrap-icons';
import { AvatarComponent } from './components/avatar/avatar.component';
import { DropdownComponent } from './components/tailwind/dropdown/dropdown.component';
import { TooltipComponent } from './components/tailwind/tooltip/tooltip.component';
import { SafeUrlPipe } from './pipes/safe-url.pipe';


@NgModule({
	declarations: [
		DropdownComponent,
		TooltipComponent,
		AvatarComponent,
		SafeUrlPipe,
	],
  imports: [
		CommonModule,
		RouterModule,
		NgxBootstrapIconsModule.pick(allIcons)
	],
	exports: [
		NgxBootstrapIconsModule,
		DropdownComponent,
		TooltipComponent,
		AvatarComponent,
		SafeUrlPipe,
	]
})
export class SharedModule { }
