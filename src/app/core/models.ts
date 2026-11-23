export type Role = 'admin' | 'doctor' | 'patient' | 'staff';

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  active: boolean;
  createdAt: string;
  // patient
  dob?: string;
  gender?: 'female' | 'male' | 'other';
  bloodGroup?: string;
  address?: string;
  allergies?: string;
  emergencyContact?: string;
  // doctor
  departmentId?: string;
  specialty?: string;
  fee?: number;
  bio?: string;
  experience?: number;
  workDays?: number[]; // 0 = Sunday
  startHour?: number;
  endHour?: number;
  slotMins?: number;
  // staff
  position?: string;
}

export interface Department {
  id: string;
  name: string;
  icon: string; // Material Symbols name
  description: string;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'checked-in'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  reason: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface Prescription {
  drug: string;
  dose: string;
  frequency: string;
  days: number;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  date: string;
  diagnosis: string;
  notes: string;
  vitals: { bp: string; pulse: string; temp: string; weight: string };
  prescriptions: Prescription[];
}

export interface InvoiceItem {
  label: string;
  amount: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  appointmentId?: string;
  items: InvoiceItem[];
  status: 'unpaid' | 'paid';
  createdAt: string;
  paidAt?: string;
}

export const invoiceTotal = (i: Invoice) => i.items.reduce((s, x) => s + x.amount, 0);
