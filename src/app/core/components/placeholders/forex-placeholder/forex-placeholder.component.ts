import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-forex-placeholder',
  templateUrl: './forex-placeholder.component.html',
  styles: [
    `
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForexPlaceholderComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
