import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-crypto-placeholder',
  templateUrl: './crypto-placeholder.component.html',
  styles: [
    `
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CryptoPlaceholderComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
