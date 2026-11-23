import type { Appointment, AppointmentStatus, User } from './models';

/** Statuses that still hold a slot on the doctor's calendar. */
export const HOLDS_SLOT: AppointmentStatus[] = ['pending', 'confirmed', 'checked-in', 'completed'];

/** Local-time YYYY-MM-DD (toISOString would shift the day in UTC+ timezones). */
export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function hhmm(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

/** Every slot a doctor works on a date, ignoring bookings. */
export function workingSlots(doctor: User, date: string): string[] {
  const day = new Date(date + 'T00:00:00').getDay();
  if (!doctor.active || !doctor.workDays?.includes(day)) return [];
  const step = doctor.slotMins ?? 30;
  const out: string[] = [];
  for (let m = (doctor.startHour ?? 9) * 60; m + step <= (doctor.endHour ?? 17) * 60; m += step) {
    out.push(hhmm(m));
  }
  return out;
}

/** Slots still free: working slots minus booked ones minus times already past today. */
export function freeSlots(doctor: User, date: string, appts: Appointment[], now = new Date()): string[] {
  const today = isoDate(now);
  if (date < today) return [];
  const taken = new Set(
    appts
      .filter((a) => a.doctorId === doctor.id && a.date === date && HOLDS_SLOT.includes(a.status))
      .map((a) => a.time),
  );
  const nowHm = hhmm(now.getHours() * 60 + now.getMinutes());
  return workingSlots(doctor, date).filter((t) => !taken.has(t) && (date > today || t > nowHm));
}

/** Allowed status moves; anything else is rejected by the store. */
export const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['checked-in', 'cancelled', 'completed'],
  'checked-in': ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  rejected: [],
};
