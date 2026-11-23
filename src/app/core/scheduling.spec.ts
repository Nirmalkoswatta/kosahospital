// Run with: npm run test:logic  (Node's built-in runner + type stripping, no browser needed)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TRANSITIONS, freeSlots, isoDate, workingSlots } from './scheduling.ts';

const doctor = { id: 'd1', role: 'doctor', name: 'Dr. T', email: 't@x', passwordHash: '', active: true, createdAt: '', workDays: [1], startHour: 9, endHour: 11, slotMins: 30 } as const;
const MONDAY = '2030-01-07'; // a Monday
const appt = (time: string, status: string) => ({ id: time, patientId: 'p', doctorId: 'd1', date: MONDAY, time, reason: '', status, createdAt: '' }) as any;
const early = new Date('2030-01-01T08:00:00');

test('working slots follow hours and slot length', () => {
  assert.deepEqual(workingSlots(doctor as any, MONDAY), ['09:00', '09:30', '10:00', '10:30']);
  assert.deepEqual(workingSlots(doctor as any, '2030-01-08'), [], 'Tuesday is not a work day');
  assert.deepEqual(workingSlots({ ...doctor, active: false } as any, MONDAY), [], 'disabled doctor');
});

test('booked slots are hidden; cancelled/rejected free them again', () => {
  const appts = [appt('09:00', 'pending'), appt('09:30', 'cancelled'), appt('10:00', 'rejected'), appt('10:30', 'completed')];
  assert.deepEqual(freeSlots(doctor as any, MONDAY, appts, early), ['09:30', '10:00']);
});

test('past days and past times today are not bookable', () => {
  assert.deepEqual(freeSlots(doctor as any, MONDAY, [], new Date('2030-01-08T08:00:00')), []);
  assert.deepEqual(freeSlots(doctor as any, MONDAY, [], new Date('2030-01-07T09:45:00')), ['10:00', '10:30']);
});

test('isoDate uses local calendar day', () => {
  assert.equal(isoDate(new Date(2030, 0, 7, 23, 59)), '2030-01-07');
});

test('terminal statuses cannot move', () => {
  for (const s of ['completed', 'cancelled', 'rejected'] as const) assert.deepEqual(TRANSITIONS[s], []);
  assert.ok(!TRANSITIONS.pending.includes('completed'), 'must be confirmed before completing');
});
