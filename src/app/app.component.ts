import { Component, OnDestroy, OnInit } from "@angular/core";
import { getFunctions } from '@angular/fire/functions';
import { httpsCallable } from 'rxfire/functions';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ForexRequest } from './shared/models/forex.model';
import { ForexSignal } from './shared/models/forexSignal.model';
import { FirebaseUtilsService } from './shared/services/firebase-utils.service';
import { MetaApiErrorManagerService } from './shared/services/meta-api-error-manager.service';


@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styles: []
})
export class AppComponent implements OnInit, OnDestroy {
	title = "wherescrypto";
	destroyed$ = new Subject();

	constructor(
		private db: FirebaseUtilsService,
		private metaApiErr: MetaApiErrorManagerService
	) { }

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

		const fn = getFunctions(undefined, 'europe-west2');
		const verifyClient = httpsCallable<ForexRequest, any>(fn, "testSignal");
		const signal: ForexSignal = {
			symbol: ['GBPAUD.s'],
			lot: 0.01,
			openPrice: 1.74956,
			side: 'buy',
			type: 'limit',
			takeProfit: 2,
			pendingOptions: { trailingStopLoss: { distance: { distance: 20, units: 'RELATIVE_PIPS' } } }
		};
		const res = verifyClient({ id: 'edf93eb6-f9d5-472b-bc5e-d19c1c871eb3', signal });
		res.pipe(takeUntil(this.destroyed$))
			.subscribe((res) => {
				const msg = this.metaApiErr.handleError(res.numericCode, res.stringCode, res.message);
				console.log(msg.client);
			});
	}
}
