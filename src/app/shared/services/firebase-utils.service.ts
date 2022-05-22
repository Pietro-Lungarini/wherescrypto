import { Injectable } from '@angular/core';
import { collection, doc, docData, DocumentReference, getDoc, getDocs, getFirestore, query, setDoc, updateDoc } from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';



@Injectable({
  providedIn: 'root'
})
export class FirebaseUtilsService {

	firestore = getFirestore();

	constructor() { }
	
	getDoc<T>(path: string): Observable<T | undefined> {
		if (!path) return of(undefined);
		const docRef = doc(this.firestore, path) as DocumentReference<T>;
		return docData<T>(docRef, { idField: 'id' });
	}

	getCol<T>(path: string, q?: any): Observable<T[]> {
		if (!path) return of([]);

		let ref; 
		if (q) ref = query(collection(this.firestore, path), q);
		else ref = collection(this.firestore, path);

		return from(getDocs(ref)).pipe(
			map((docSnap) => {
				return docSnap.docs.map(doc => ({
					id: doc.id,
					...(doc.data() as object),
				}) as unknown as T);
			})
		)
	};

	async upsert<T>(path: string, obj: T): Promise<void> {
		if (!path) return;

		const docRef = doc(this.firestore, path);
		const exist = (await getDoc(docRef)).exists();

		if (!exist)
			return await setDoc(docRef, {
				...obj,
				createdAt: new Date(),
				updatedAt: new Date(),
			}, { merge: true });
		
		return await updateDoc(docRef, {
			...obj,
			updatedAt: new Date(),
		});
	}
}
