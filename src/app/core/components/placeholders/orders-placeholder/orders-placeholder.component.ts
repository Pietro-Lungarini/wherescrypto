import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-orders-placeholder',
  templateUrl: './orders-placeholder.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersPlaceholderComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
