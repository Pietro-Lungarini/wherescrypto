import { Injectable } from '@angular/core';
import { take } from 'rxjs/operators';
import { UsersService } from 'src/app/auth/services/users.service';
import { ExchangeInput } from 'src/app/shared/models/exchanges.model';


@Injectable({
  providedIn: 'root'
})
export class CryptoExchangesService {

	constructor(private user: UsersService) { }
	
	async saveApiKeys(exchanges?: ExchangeInput[]): Promise<void> {
		const u = await this.user.currentUserDb$.pipe(take(1)).toPromise();
		if (!u.id) return;
		
		this.user.edit(u.id, {exchanges: exchanges})
	}
}
