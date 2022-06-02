import { Component, OnDestroy, OnInit } from '@angular/core';
import { getFunctions } from '@angular/fire/functions';
import { httpsCallable } from 'rxfire/functions';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ForexRequest } from './shared/models/forex.model';
import { ForexSignal } from './shared/models/forexSignal.model';
import { MTAccount } from './shared/models/mtaccount.model';
import { FirebaseUtilsService } from './shared/services/firebase-utils.service';
import { MetaApiErrorManagerService } from './shared/services/meta-api-error-manager.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: [],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'wherescrypto';
  destroyed$ = new Subject();

  constructor(
    private db: FirebaseUtilsService,
    private metaApiErr: MetaApiErrorManagerService
  ) {}

  ngOnInit(): void {
    this.verify();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  async verify(): Promise<void> {
    /* const id = 354906;
		const fn = getFunctions(undefined, 'europe-west2');
		const verifyClient = httpsCallable<iGeniusRequest, iGeniusUser>(fn, "verifyClient");
		const res = verifyClient({id});
		res.pipe(takeUntil(this.destroyed$))
		.subscribe(user => {
			console.log(user);
			localStorage.setItem('testUser', JSON.stringify(user));
		});
		
		this.db.getDoc(`verifyUsers/${id}`)
			.pipe(takeUntil(this.destroyed$))
			.subscribe((data) => console.log(data)); */

    /* const user = JSON.parse(localStorage.getItem('testUser') || '');
		console.log(user.lastOrder); */
  }
}
