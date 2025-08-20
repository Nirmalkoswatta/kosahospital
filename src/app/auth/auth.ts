import { Injectable, Injector } from '@angular/core';
import { FirebaseService } from '../core/firebase.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';

export type UserRecord = {
  name?: string;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'patient' | 'employee';
  // optional doctor-specific fields
  speciality?: string;
  license?: string;
  phone?: string;
  gender?: string;
  province?: string;
  city?: string;
  disease?: string;
  age?: number;
  doctorId?: string;
  notes?: string[];
};

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private storageKey = 'hosp_users_v1';
  currentUser: UserRecord | null = null;
  // resolves when auth has processed initial Firebase state (so guards can wait)
  ready: Promise<void> = Promise.resolve();
  private _resolveReady: (() => void) | null = null;
  private fbAuth: any = null;
  private fbService: FirebaseService | null = null;
  private fbAuthWrapper: FirebaseAuthService | null = null;

  constructor(private injector?: Injector) {
    try {
      // attempt to retrieve FirebaseAuthService and FirebaseService if available
      this.fbAuthWrapper = injector ? injector.get(FirebaseAuthService, null as any) : null;
      this.fbService = injector ? injector.get(FirebaseService, null as any) : null;
      this.fbAuth = this.fbAuthWrapper;
      // if firebase service available, listen for auth state via firebase/auth on the wrapper side
      // attach auth state listener so we restore session on page reload
      if (this.fbService) {
        // provide a promise that guards can await so we don't redirect before firebase restores session
        this.ready = new Promise<void>((resolve) => {
          this._resolveReady = resolve;
        });
        // run async initialization without making constructor async
        (async () => {
          try {
            await this.fbService!.init();
            const { onAuthStateChanged } = await import('firebase/auth');
            onAuthStateChanged(this.fbService!.auth, async (fbUser: any) => {
              if (fbUser) {
                try {
                  const snap = await getDoc(doc(this.fbService!.db, 'users', fbUser.uid));
                  if (snap.exists()) {
                    this.currentUser = { ...(snap.data() as any) } as UserRecord;
                  } else {
                    // fallback minimal profile
                    this.currentUser = { email: fbUser.email || '', password: '', role: 'patient' } as UserRecord;
                  }
                } catch {
                  this.currentUser = { email: fbUser.email || '', password: '', role: 'patient' } as UserRecord;
                }
              } else {
                this.currentUser = null;
              }
              // resolve ready once first auth state is observed
              if (this._resolveReady) {
                this._resolveReady();
                this._resolveReady = null;
              }
            });
          } catch {
            // ignore initialization errors but resolve ready so guards don't hang
            if (this._resolveReady) {
              this._resolveReady();
              this._resolveReady = null;
            }
          }
        })();
      }
    } catch {
      this.fbAuth = null;
    }
  }
  async register(user: UserRecord) {
    // If firebase auth wrapper is available, prefer that for account creation
    if (this.fbAuthWrapper) {
      const fbUser = await this.fbAuthWrapper.register(user.email, user.password);
      // persist profile to Firestore under uid
      if (this.fbService) {
        await this.fbService.init();
        await setDoc(doc(this.fbService.db, 'users', fbUser.uid), { ...user, uid: fbUser.uid });
      }
      this.currentUser = { ...user, doctorId: user.doctorId } as UserRecord;
      return fbUser;
    }

    // fallback to localStorage (rare)
    const users = this.getAllUsers();
    users.push(user);
    localStorage.setItem(this.storageKey, JSON.stringify(users));
    return true;
  }

  async login(email: string, password: string, role: string) {
    // Admin special-case: secret password grants admin access
    if (role === 'admin' && password === 'ADMINKOSA003') {
      this.currentUser = { email: 'admin@kosa', password, role: 'admin' };
      return true;
    }
    // try firebase login if available
    if (this.fbAuthWrapper) {
      try {
        const fbUser = await this.fbAuthWrapper.login(email, password);
        if (this.fbService) {
          await this.fbService.init();
          const snap = await getDoc(doc(this.fbService.db, 'users', fbUser.uid));
          if (snap.exists()) {
            const data = snap.data() as any;
            this.currentUser = { ...data } as UserRecord;
            return true;
          }
        }
        // fallback if profile not found
        this.currentUser = { email, password, role } as UserRecord;
        return true;
      } catch (e) {
        return false;
      }
    }

    const users = this.getAllUsers();
    const found = users.find(u => u.email === email && u.password === password && u.role === role);
    if (found) {
      this.currentUser = found;
      return true;
    }
    return false;
  }

  logout() {
    this.currentUser = null;
  }

  getAllUsers(): UserRecord[] {
    // synchronous fallback (legacy). For Firestore-backed users use direct Firestore queries.
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // async helper to fetch all users from Firestore
  async getAllUsersAsync() {
    if (!this.fbService) return this.getAllUsers();
    await this.fbService.init();
    const snaps = await getDocs(collection(this.fbService.db, 'users'));
    return snaps.docs.map(d => d.data());
  }
}
