import { Injectable } from '@angular/core';
import { firebaseConfig } from '../../environments/firebase';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  app: any = null;
  auth: any = null;
  db: any = null;

  private initialized = false;

  async init() {
    if (this.initialized) return;
    // dynamic import to avoid compile-time dependency
    const firebaseApp = await import('firebase/app');
    const firebaseAuth = await import('firebase/auth');
    const firebaseFirestore = await import('firebase/firestore');
    this.app = firebaseApp.initializeApp(firebaseConfig);
    this.auth = firebaseAuth.getAuth(this.app);
    this.db = firebaseFirestore.getFirestore(this.app);
    this.initialized = true;
  }
}
