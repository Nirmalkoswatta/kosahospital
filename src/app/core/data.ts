import { Injectable } from '@angular/core';
import { Auth, UserRecord } from '../auth/auth';
import { FirebaseService } from './firebase.service';

export type Doctor = {
  id: string;
  name: string;
  email?: string;
  speciality?: string;
};

export type Patient = {
  id: string;
  name: string;
  email?: string;
  age?: number;
  phone?: string;
  gender?: string;
  province?: string;
  city?: string;
  disease?: string;
  doctorId?: string;
  notes?: string[];
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  datetime?: string;
  amount?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  notes?: string;
};

@Injectable({ providedIn: 'root' })
export class DataService {
  private doctorsKey = 'hosp_doctors_v1';
  private patientsKey = 'hosp_patients_v1';
  private appointmentsKey = 'hosp_appointments_v1';

  constructor(private auth: Auth) {
    // try to initialize Firebase in background; if available we'll sync changes to Firestore
    // note: keep localStorage as the primary synchronous source for existing callers
    // but attempt to enable remote sync when Firebase becomes available
    // (we can't await in constructor; do it fire-and-forget)
    setTimeout(() => {
      try {
        // lazy-get the service via injector pattern to avoid circular issues
        const fb = (this as any).fbService as FirebaseService | undefined;
        if (!fb) return;
        fb.init().then(() => { (this as any).useFirestore = true; }).catch(() => {});
      } catch (e) { /* ignore */ }
    }, 0);
    // seed doctors from registered users with role doctor if none exist
    const doctors = this.getDoctors();
    if (doctors.length === 0) {
      const regs = this.auth.getAllUsers();
      const seeded = regs.filter(u => u.role === 'doctor').map(d => ({ id: this.id(), name: d.name || d.email || ('Dr ' + d.email), email: d.email } as Doctor));
      if (seeded.length) this.saveDoctors(seeded);
    }

    // if Firebase is available, perform a one-time migration and attach listeners
    setTimeout(() => {
      const fb: FirebaseService | undefined = (this as any).fbService;
      if (!fb) return;
      fb.init().then(() => {
        try {
          const migrated = localStorage.getItem('hosp_migrated_v1');
          if (!migrated) {
            // push local collections to Firestore
            this.syncDoctorsRemote(this.getDoctors()).catch(() => {});
            this.syncPatientsRemote(this.getPatients()).catch(() => {});
            this.syncAppointmentsRemote(this.getAppointments()).catch(() => {});
            localStorage.setItem('hosp_migrated_v1', '1');
          }
        } catch (e) { }

        // attach realtime listeners to populate caches when remote changes
        this.attachRealtimeListeners(fb).catch(() => {});
      }).catch(() => {});
    }, 1000);
  }

  // optional firebase service instance will be attached later via DI by consumers that can provide it.
  // To keep this file backward-compatible and avoid changing callers, the service will attempt
  // to use a runtime-provided FirebaseService instance (see app module providers) named `fbService`.
  // If none is present, DataService continues with localStorage-only behaviour.
  // For projects using DI, you can set: (dataService as any).fbService = injector.get(FirebaseService)

  private useFirestore = false;
  // in-memory caches kept in sync with Firestore when available
  private doctorsCache: Doctor[] = [];
  private patientsCache: Patient[] = [];
  private appointmentsCache: Appointment[] = [];

  private id() { return Math.random().toString(36).slice(2, 9); }

  // Doctors
  getDoctors(): Doctor[] {
    if (this.useFirestore) return this.doctorsCache.slice();
    const raw = localStorage.getItem(this.doctorsKey);
    return raw ? JSON.parse(raw) as Doctor[] : [];
  }
  saveDoctors(d: Doctor[]) {
    if (this.useFirestore) {
      // update cache and remote
      this.doctorsCache = d.slice();
      this.emit('doctors');
      // write through asynchronously
      this.syncDoctorsRemote(d).catch(() => {});
      return;
    }
    localStorage.setItem(this.doctorsKey, JSON.stringify(d));
    this.syncDoctorsRemote(d);
    this.emit('doctors');
  }
  addDoctor(doc: Doctor) {
    if (this.useFirestore) {
      this.doctorsCache.push(doc);
      this.emit('doctors');
      // write single doc
      this.syncDoctorsRemote(this.doctorsCache).catch(() => {});
      return;
    }
    const d = this.getDoctors(); d.push(doc); this.saveDoctors(d);
  }

  // attempt to sync doctors to Firestore in background (non-blocking)
  private async syncDoctorsRemote(docs: Doctor[]) {
    try {
      const fb: FirebaseService | undefined = (this as any).fbService;
      if (!fb) return;
      await fb.init();
      const { collection, doc, setDoc } = await import('firebase/firestore');
      const col = collection(fb.db, 'doctors');
      // write each doctor as a doc with id
      await Promise.all(docs.map(x => setDoc(doc(fb.db, 'doctors', x.id), x)));
    } catch (err) {
      console.warn('syncDoctorsRemote failed', err);
    }
  }

  // Patients
  getPatients(): Patient[] {
    if (this.useFirestore) return this.patientsCache.slice();
    const raw = localStorage.getItem(this.patientsKey);
    return raw ? JSON.parse(raw) as Patient[] : [];
  }
  savePatients(p: Patient[]) {
    if (this.useFirestore) {
      this.patientsCache = p.slice();
      this.emit('patients');
      this.syncPatientsRemote(p).catch(() => {});
      return;
    }
    localStorage.setItem(this.patientsKey, JSON.stringify(p));
    this.syncPatientsRemote(p);
  }
  addPatient(p: Patient) {
    if (this.useFirestore) {
      this.patientsCache.push(p);
      this.emit('patients');
      this.syncPatientsRemote(this.patientsCache).catch(() => {});
      return;
    }
    const arr = this.getPatients(); arr.push(p); this.savePatients(arr);
  }

  private emit(event: 'doctors' | 'patients' | 'appointments') {
    const subs = (this as any)._subs && (this as any)._subs[event];
    if (!subs) return;
    subs.forEach((fn: any) => { try { fn(); } catch { } });
  }

  subscribe(event: 'doctors' | 'patients' | 'appointments', fn: () => void) {
    (this as any)._subs = (this as any)._subs || {};
    (this as any)._subs[event] = (this as any)._subs[event] || [];
    (this as any)._subs[event].push(fn);
    return () => { (this as any)._subs[event] = (this as any)._subs[event].filter((f: any) => f !== fn); };
  }

  private async syncPatientsRemote(patients: Patient[]) {
    try {
      const fb: FirebaseService | undefined = (this as any).fbService;
      if (!fb) return;
      await fb.init();
      const { collection, doc, setDoc } = await import('firebase/firestore');
      await Promise.all(patients.map(x => setDoc(doc(fb.db, 'patients', x.id), x)));
    } catch (err) {
      console.warn('syncPatientsRemote failed', err);
    }
  }

  private async attachRealtimeListeners(fb: FirebaseService) {
    try {
      const { collection, onSnapshot } = await import('firebase/firestore');
      // doctors
      const docsCol = collection(fb.db, 'doctors');
      onSnapshot(docsCol, (snap: any) => {
        const arr: Doctor[] = [];
        snap.forEach((d: any) => arr.push({ id: d.id, ...(d.data ? d.data() : {}) } as Doctor));
        this.doctorsCache = arr;
        this.useFirestore = true;
        this.emit('doctors');
      });

      // patients
      const ptsCol = collection(fb.db, 'patients');
      onSnapshot(ptsCol, (snap: any) => {
        const arr: Patient[] = [];
        snap.forEach((d: any) => arr.push({ id: d.id, ...(d.data ? d.data() : {}) } as Patient));
        this.patientsCache = arr;
        this.useFirestore = true;
        this.emit('patients');
      });

      // appointments
      const apCol = collection(fb.db, 'appointments');
      onSnapshot(apCol, (snap: any) => {
        const arr: Appointment[] = [];
        snap.forEach((d: any) => arr.push({ id: d.id, ...(d.data ? d.data() : {}) } as Appointment));
        this.appointmentsCache = arr;
        this.useFirestore = true;
        this.emit('appointments');
      });
    } catch (err) {
      console.warn('attachRealtimeListeners failed', err);
    }
  }

  // Appointments
  getAppointments(): Appointment[] {
    if (this.useFirestore) return this.appointmentsCache.slice();
    const raw = localStorage.getItem(this.appointmentsKey);
    return raw ? JSON.parse(raw) as Appointment[] : [];
  }
  saveAppointments(a: Appointment[]) {
    if (this.useFirestore) {
      this.appointmentsCache = a.slice();
      this.emit('appointments');
      this.syncAppointmentsRemote(a).catch(() => {});
      return;
    }
    localStorage.setItem(this.appointmentsKey, JSON.stringify(a));
  }
  bookAppointment(a: Partial<Appointment>) {
    const arr = this.getAppointments();
    const ap: Appointment = { id: this.id(), patientId: a.patientId!, doctorId: a.doctorId!, datetime: a.datetime || '', amount: a.amount || 0, status: 'pending', notes: a.notes || '' };
    arr.push(ap); this.saveAppointments(arr); return ap;
  }
  acceptAppointment(id: string, datetime?: string, amount?: number, note?: string) {
    const arr = this.getAppointments();
    const idx = arr.findIndex(x => x.id === id);
    if (idx === -1) return null;
    arr[idx].status = 'accepted';
    if (datetime) arr[idx].datetime = datetime;
    if (amount !== undefined) arr[idx].amount = amount;
    if (note) arr[idx].notes = note;
    this.saveAppointments(arr);
    return arr[idx];
  }

  private async syncAppointmentsRemote(apps: Appointment[]) {
    try {
      const fb: FirebaseService | undefined = (this as any).fbService;
      if (!fb) return;
      await fb.init();
      const { collection, doc, setDoc } = await import('firebase/firestore');
      await Promise.all(apps.map(x => setDoc(doc(fb.db, 'appointments', x.id), x)));
    } catch (err) {
      console.warn('syncAppointmentsRemote failed', err);
    }
  }

  addNoteToPatient(patientId: string, note: string) {
    const pts = this.getPatients();
    const p = pts.find(x => x.id === patientId);
    if (!p) return false;
    p.notes = p.notes || [];
    p.notes.push(note);
    this.savePatients(pts);
    return true;
  }
}

