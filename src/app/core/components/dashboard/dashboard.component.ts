import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';



@Component({
  templateUrl: './dashboard.component.html',
	styles: [`
		:host { display: block; }
	`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {

	pageTitle = 'Dashboard';

  constructor() { }

	ngOnInit(): void {
	}
	
}