import { Injectable, computed, effect, signal } from '@angular/core';
import {
  Appointment,
  AppointmentStatus,
  Department,
  Invoice,
  InvoiceItem,
  MedicalRecord,
  Role,
  User,
} from './models';
import { TRANSITIONS, freeSlots, isoDate } from './scheduling';

// shortcut: the whole "backend" lives in localStorage on one browser. Swap this service for
// HTTP/Firestore calls when the app needs real multi-user data; components only use this API.
const DB_KEY = 'kosa_db_v2';
const SESSION_KEY = 'kosa_session_v2';
export const DEMO_PASSWORD = 'Kosa@123';

interface Db {
  users: User[];
  departments: Department[];
  appointments: Appointment[];
  records: MedicalRecord[];
  invoices: Invoice[];
}

const uid = () => crypto.randomUUID().slice(0, 8);

// shortcut: unsalted-by-secret SHA-256 is fine for a client-only demo, not for a real server.
export async function hashPassword(email: string, password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${email.trim().toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

@Injectable({ providedIn: 'root' })
export class Store {
  private db = signal<Db>({ users: [], departments: [], appointments: [], records: [], invoices: [] });
  private sessionId = signal<string | null>(localStorage.getItem(SESSION_KEY));

  readonly users = computed(() => this.db().users);
  readonly departments = computed(() => this.db().departments);
  readonly appointments = computed(() => this.db().appointments);
  readonly records = computed(() => this.db().records);
  readonly invoices = computed(() => this.db().invoices);

  readonly doctors = computed(() => this.users().filter((u) => u.role === 'doctor'));
  readonly patients = computed(() => this.users().filter((u) => u.role === 'patient'));
  readonly staff = computed(() => this.users().filter((u) => u.role === 'staff'));
  private byId = computed(() => new Map(this.users().map((u) => [u.id, u])));
  readonly me = computed(() => {
    const u = this.byId().get(this.sessionId() ?? '');
    return u?.active ? u : null;
  });

  constructor() {
    effect(() => {
      const db = this.db();
      if (db.users.length) localStorage.setItem(DB_KEY, JSON.stringify(db));
    });
    effect(() => {
      const id = this.sessionId();
      id ? localStorage.setItem(SESSION_KEY, id) : localStorage.removeItem(SESSION_KEY);
    });
  }

  async init() {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      try {
        this.db.set(JSON.parse(raw));
        return;
      } catch {
        /* corrupt storage: fall through to a fresh seed */
      }
    }
    this.db.set(await seed());
  }

  user(id: string | undefined) {
    return id ? this.byId().get(id) : undefined;
  }
  department(id: string | undefined) {
    return this.departments().find((d) => d.id === id);
  }

  // ---------- auth ----------
  async login(email: string, password: string): Promise<User> {
    const u = this.users().find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || u.passwordHash !== (await hashPassword(email, password))) {
      throw new Error('Email or password is incorrect.');
    }
    if (!u.active) throw new Error('This account is disabled. Contact the front desk.');
    this.sessionId.set(u.id);
    return u;
  }

  logout() {
    this.sessionId.set(null);
  }

  async createUser(data: Partial<User> & { role: Role; name: string; email: string }, password: string) {
    const email = data.email.trim().toLowerCase();
    if (this.users().some((u) => u.email.toLowerCase() === email)) {
      throw new Error('An account with this email already exists.');
    }
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    const user: User = {
      active: true,
      createdAt: new Date().toISOString(),
      ...(data.role === 'doctor' ? { workDays: [1, 2, 3, 4, 5], startHour: 9, endHour: 17, slotMins: 30, fee: 2500 } : {}),
      ...data,
      id: uid(),
      email,
      passwordHash: await hashPassword(email, password),
    };
    this.patch((db) => ({ ...db, users: [...db.users, user] }));
    return user;
  }

  async registerPatient(data: Partial<User> & { name: string; email: string }, password: string) {
    const u = await this.createUser({ ...data, role: 'patient' }, password);
    this.sessionId.set(u.id);
    return u;
  }

  updateUser(id: string, changes: Partial<User>) {
    const { passwordHash, id: _id, role, email, ...safe } = changes; // identity fields are not editable here
    this.patch((db) => ({ ...db, users: db.users.map((u) => (u.id === id ? { ...u, ...safe } : u)) }));
  }

  async changePassword(id: string, current: string, next: string) {
    const u = this.user(id);
    if (!u || u.passwordHash !== (await hashPassword(u.email, current))) {
      throw new Error('Current password is incorrect.');
    }
    if (next.length < 8) throw new Error('New password must be at least 8 characters.');
    const passwordHash = await hashPassword(u.email, next);
    this.patch((db) => ({ ...db, users: db.users.map((x) => (x.id === id ? { ...x, passwordHash } : x)) }));
  }

  // ---------- appointments ----------
  book(a: Pick<Appointment, 'patientId' | 'doctorId' | 'date' | 'time' | 'reason'>) {
    const doctor = this.user(a.doctorId);
    if (!doctor || doctor.role !== 'doctor') throw new Error('Choose a doctor.');
    if (!freeSlots(doctor, a.date, this.appointments()).includes(a.time)) {
      throw new Error('That slot was just taken. Pick another time.');
    }
    const appt: Appointment = { ...a, id: uid(), status: 'pending', createdAt: new Date().toISOString() };
    this.patch((db) => ({ ...db, appointments: [...db.appointments, appt] }));
    return appt;
  }

  setStatus(id: string, status: AppointmentStatus) {
    const a = this.appointments().find((x) => x.id === id);
    if (!a) throw new Error('Appointment not found.');
    if (!TRANSITIONS[a.status].includes(status)) {
      throw new Error(`Cannot move an appointment from ${a.status} to ${status}.`);
    }
    this.patch((db) => ({
      ...db,
      appointments: db.appointments.map((x) => (x.id === id ? { ...x, status } : x)),
    }));
  }

  /** Doctor finishes a visit: saves the record, completes the appointment, bills the fee. */
  completeVisit(appointmentId: string, rec: Omit<MedicalRecord, 'id' | 'patientId' | 'doctorId' | 'date' | 'appointmentId'>, extra: InvoiceItem[] = []) {
    const a = this.appointments().find((x) => x.id === appointmentId);
    if (!a) throw new Error('Appointment not found.');
    this.setStatus(appointmentId, 'completed');
    const doctor = this.user(a.doctorId);
    const record: MedicalRecord = {
      ...rec,
      id: uid(),
      appointmentId,
      patientId: a.patientId,
      doctorId: a.doctorId,
      date: isoDate(new Date()),
    };
    const invoice: Invoice = {
      id: uid(),
      patientId: a.patientId,
      appointmentId,
      items: [{ label: `Consultation — ${doctor?.name ?? 'Doctor'}`, amount: doctor?.fee ?? 0 }, ...extra],
      status: 'unpaid',
      createdAt: new Date().toISOString(),
    };
    this.patch((db) => ({ ...db, records: [...db.records, record], invoices: [...db.invoices, invoice] }));
    return record;
  }

  // ---------- billing ----------
  addInvoice(patientId: string, items: InvoiceItem[]) {
    if (!items.length || items.some((i) => !i.label.trim() || !(i.amount > 0))) {
      throw new Error('Each line needs a description and an amount above zero.');
    }
    const inv: Invoice = { id: uid(), patientId, items, status: 'unpaid', createdAt: new Date().toISOString() };
    this.patch((db) => ({ ...db, invoices: [...db.invoices, inv] }));
    return inv;
  }

  payInvoice(id: string) {
    this.patch((db) => ({
      ...db,
      invoices: db.invoices.map((i) =>
        i.id === id && i.status === 'unpaid' ? { ...i, status: 'paid', paidAt: new Date().toISOString() } : i,
      ),
    }));
  }

  // ---------- admin ----------
  addDepartment(d: Omit<Department, 'id'>) {
    if (!d.name.trim()) throw new Error('Department name is required.');
    this.patch((db) => ({ ...db, departments: [...db.departments, { ...d, id: uid() }] }));
  }

  async resetDemo() {
    this.sessionId.set(null);
    this.db.set(await seed());
  }

  private patch(fn: (db: Db) => Db) {
    this.db.update(fn);
  }
}

// ---------- seed data ----------
async function seed(): Promise<Db> {
  const now = new Date().toISOString();
  const day = (offset: number) => isoDate(new Date(Date.now() + offset * 86400000));
  const departments: Department[] = [
    { id: 'card', name: 'Cardiology', icon: 'cardiology', description: 'Heart and vascular care, ECG, echo and stress testing.' },
    { id: 'neur', name: 'Neurology', icon: 'neurology', description: 'Brain, spine and nerve disorders, stroke follow-up.' },
    { id: 'pedi', name: 'Pediatrics', icon: 'child_care', description: 'Newborn to teen care, vaccinations and growth checks.' },
    { id: 'orth', name: 'Orthopedics', icon: 'orthopedics', description: 'Bones, joints, sports injuries and rehabilitation.' },
    { id: 'derm', name: 'Dermatology', icon: 'dermatology', description: 'Skin, hair and nail conditions.' },
    { id: 'genm', name: 'General Medicine', icon: 'stethoscope', description: 'First stop for check-ups and everyday illness.' },
  ];
  const mk = async (u: Omit<User, 'passwordHash' | 'active' | 'createdAt'>): Promise<User> => ({
    active: true,
    createdAt: now,
    ...u,
    passwordHash: await hashPassword(u.email, DEMO_PASSWORD),
  });
  const doc = (id: string, name: string, departmentId: string, specialty: string, fee: number, experience: number, workDays: number[], bio: string) =>
    mk({ id, role: 'doctor', name, email: `${id}@kosa.lk`, departmentId, specialty, fee, experience, workDays, startHour: 9, endHour: 16, slotMins: 30, bio, phone: '+94 11 200 0000' });

  const users = await Promise.all([
    mk({ id: 'admin', role: 'admin', name: 'Kosa Admin', email: 'admin@kosa.lk' }),
    doc('dr.perera', 'Dr. Anjali Perera', 'card', 'Interventional Cardiologist', 3500, 14, [1, 2, 3, 4, 5], 'Leads the cath lab; focuses on preventive cardiology.'),
    doc('dr.silva', 'Dr. Ruwan Silva', 'neur', 'Neurologist', 3200, 11, [1, 3, 5], 'Stroke and epilepsy clinics.'),
    doc('dr.fernando', 'Dr. Nadia Fernando', 'pedi', 'Pediatrician', 2500, 9, [1, 2, 3, 4, 5, 6], 'Gentle care for children, vaccination programmes.'),
    doc('dr.jayasuriya', 'Dr. Kasun Jayasuriya', 'orth', 'Orthopedic Surgeon', 3000, 16, [2, 4, 6], 'Sports injuries and joint replacement.'),
    doc('dr.wickrama', 'Dr. Ishara Wickrama', 'derm', 'Dermatologist', 2800, 7, [1, 2, 4, 5], 'Eczema, acne and skin cancer screening.'),
    doc('dr.rajapaksha', 'Dr. Malith Rajapaksha', 'genm', 'General Physician', 1800, 12, [0, 1, 2, 3, 4, 5, 6], 'Same-day consultations and health checks.'),
    mk({ id: 'staff.nimali', role: 'staff', name: 'Nimali Herath', email: 'reception@kosa.lk', position: 'Front Desk Lead', phone: '+94 11 200 0101' }),
    mk({ id: 'staff.dilan', role: 'staff', name: 'Dilan Kumara', email: 'billing@kosa.lk', position: 'Billing Officer', phone: '+94 11 200 0102' }),
    mk({ id: 'pt.amaya', role: 'patient', name: 'Amaya Gunawardena', email: 'patient@kosa.lk', phone: '+94 77 123 4567', dob: '1991-04-12', gender: 'female', bloodGroup: 'O+', address: 'Colombo 05', allergies: 'Penicillin', emergencyContact: 'Sahan — +94 77 765 4321' }),
    mk({ id: 'pt.tharindu', role: 'patient', name: 'Tharindu Bandara', email: 'tharindu@kosa.lk', phone: '+94 71 555 0102', dob: '1984-09-30', gender: 'male', bloodGroup: 'A+', address: 'Kandy' }),
    mk({ id: 'pt.sachini', role: 'patient', name: 'Sachini Dias', email: 'sachini@kosa.lk', phone: '+94 76 555 0199', dob: '2016-02-02', gender: 'female', bloodGroup: 'B+', address: 'Galle' }),
  ]);

  const appointments: Appointment[] = [
    { id: 'a1', patientId: 'pt.amaya', doctorId: 'dr.perera', date: day(-14), time: '10:00', reason: 'Chest tightness after exercise', status: 'completed', createdAt: now },
    { id: 'a2', patientId: 'pt.amaya', doctorId: 'dr.rajapaksha', date: day(0), time: '15:30', reason: 'Fever and sore throat', status: 'confirmed', createdAt: now },
    { id: 'a3', patientId: 'pt.tharindu', doctorId: 'dr.rajapaksha', date: day(0), time: '15:00', reason: 'Annual check-up', status: 'checked-in', createdAt: now },
    { id: 'a4', patientId: 'pt.sachini', doctorId: 'dr.rajapaksha', date: day(1), time: '09:30', reason: 'Persistent cough', status: 'pending', createdAt: now },
    { id: 'a5', patientId: 'pt.tharindu', doctorId: 'dr.jayasuriya', date: day(2), time: '11:00', reason: 'Knee pain while running', status: 'pending', createdAt: now },
    { id: 'a6', patientId: 'pt.amaya', doctorId: 'dr.perera', date: day(5), time: '09:00', reason: 'Follow-up: stress test results', status: 'confirmed', createdAt: now },
  ];
  const records: MedicalRecord[] = [
    {
      id: 'r1', patientId: 'pt.amaya', doctorId: 'dr.perera', appointmentId: 'a1', date: day(-14),
      diagnosis: 'Exercise-induced angina — rule out', notes: 'ECG normal at rest. Booked treadmill stress test. Avoid strenuous exercise until results.',
      vitals: { bp: '128/84', pulse: '78', temp: '36.8', weight: '61' },
      prescriptions: [{ drug: 'Aspirin', dose: '75 mg', frequency: 'Once daily', days: 30 }],
    },
  ];
  const invoices: Invoice[] = [
    { id: 'i1', patientId: 'pt.amaya', appointmentId: 'a1', items: [{ label: 'Consultation — Dr. Anjali Perera', amount: 3500 }, { label: 'Resting ECG', amount: 1800 }], status: 'paid', createdAt: now, paidAt: now },
    { id: 'i2', patientId: 'pt.tharindu', items: [{ label: 'Lipid profile', amount: 2400 }], status: 'unpaid', createdAt: now },
  ];
  return { users, departments, appointments, records, invoices };
}
