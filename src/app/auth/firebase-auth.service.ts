import { Injectable } from '@angular/core';
import { FirebaseService } from '../core/firebase.service';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  constructor(private fb: FirebaseService) {}

  async register(email: string, password: string) {
    await this.fb.init();
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const cred = await createUserWithEmailAndPassword(this.fb.auth, email, password);
    return cred.user;
  }

  async login(email: string, password: string) {
    await this.fb.init();
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const cred = await signInWithEmailAndPassword(this.fb.auth, email, password);
    return cred.user;
  }

  async logout() {
    await this.fb.init();
    const { signOut } = await import('firebase/auth');
    await signOut(this.fb.auth);
  }
}
