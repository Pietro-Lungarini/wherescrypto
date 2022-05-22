import { Injectable } from '@angular/core';
import { getAuth, User } from '@firebase/auth';
import { user } from 'rxfire/auth';
import { Observable, of, ReplaySubject } from 'rxjs';
import { FirebaseUtilsService } from 'src/app/shared/services/firebase-utils.service';
import { Roles } from '../models/roles.model';
import { UserDetails } from '../models/user-details.model';
import { User as DbUser } from '../models/user.model';


@Injectable({
	providedIn: 'root'
})
export class UsersService {

  public currentUserDb$: ReplaySubject<DbUser> = new ReplaySubject(1);

  private defaultRoles: Roles = {
  	subscriber: true,
  	editor: false,
  	admin: false,
  };
  private colors:
    ('red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink')[]
  = [
  	'red',
  	'yellow',
  	'green',
  	'blue',
  	'indigo',
  	'purple',
  	'pink'
		];
	private auth = getAuth();
	

  constructor(private myDb: FirebaseUtilsService) { }

  /**
   * Initialize User db
   */
  public initUserDb() {
  	this.getCurrentDb().then(user$ => {
  		if (!user$) return;
  		user$.subscribe(user => {
  			this.currentUserDb$.next(user);
  		});
  	});
  }

  /**
   * Update or create a user.
   *
   * @param user User details as firebase.User interface.
   * @param additionalDetails If provides, set additional details to the UserDetails.additional interface.
   */
	async editOrCreate(user: User, forceEdits: boolean = true, additionalDetails?: any, isSignup?: boolean): Promise<boolean> {
  	try {
  		const toFirebaseUser: DbUser = {
  			id: user.uid || '',
  			name: user.displayName || additionalDetails?.fullName || '',
  			email: user.email || '',
  			disabled: false,
  			roles: additionalDetails?.roles || this.defaultRoles,
  			details: (isSignup ? {
  				imgUrl: user.photoURL || null,
  				imgColorBg: additionalDetails?.imgColorBg || this.colors[Math.floor(Math.random() * this.colors.length)],
  				phoneNumber: user.phoneNumber || (additionalDetails)?.phoneNumber || null,
  				lastLogin: new Date().toISOString(),
  				profileUrlRef: additionalDetails?.profileUrlRef || null,
  			} : {
  				imgUrl: user.photoURL || null,
  				phoneNumber: user.phoneNumber || (additionalDetails)?.phoneNumber || null,
  				lastLogin: new Date().toISOString(),
  				profileUrlRef: additionalDetails?.profileUrlRef || null,
  				firstLogin: false,
  			} ) as UserDetails
			};
			
			console.log('User', forceEdits, isSignup);

  		if (forceEdits || isSignup) {
  			await this.myDb.upsert(`/users/${user.uid}`, toFirebaseUser);
  		}

  		return true;
  	} catch (err) {
  		console.error(err);
  		return false;
  	}
	}
	
	/**
	 * Edit user details.
	 */
	async edit(uid: string, data: any): Promise<void> {
		if (!uid) return;
		await this.myDb.upsert(`/users/${uid}`, data);
	}

  /**
   * Get all Users with a query (if set).
   *
   * @returns an Observable with a list of Users.
   */
  getAll(query?: any): Observable<DbUser[]> {
  	return this.myDb.getCol<DbUser>('users', query);
  }

  /**
   * Get a single user.
   *
   * @param id Set it to firebase.User.uid
   */
  get(id: string): Observable<DbUser | undefined> {
  	return this.myDb.getDoc<DbUser>(`users/${id}`);
  }

  /**
   * Get current user from Firebase.
   */
  getCurrentFire(): Promise<User | null> {
  	return user(this.auth).toPromise();
  }

  /**
   * Get current user from db.
   */
  private async getCurrentDb(): Promise<Observable<DbUser | undefined>> {
  	const afUser = await this.getCurrentFire();
  	if (!afUser) return of(undefined);
  	return this.get(afUser.uid);
  }

}
