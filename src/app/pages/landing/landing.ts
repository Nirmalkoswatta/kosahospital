import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '../../core/store';
import { InitialsPipe, LkrPipe } from '../../shared/format';
import { Tilt } from '../../shared/tilt';
import { HeroScene } from './hero-scene';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, HeroScene, Tilt, InitialsPipe, LkrPipe],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  store = inject(Store);
  doctors = computed(() => this.store.doctors().filter((d) => d.active).slice(0, 6));
  portals = [
    { icon: 'personal_injury', title: 'Patients', text: 'Book visits in seconds, see prescriptions and pay bills from your phone.', points: ['Live slot booking', 'Medical history', 'Online bills'] },
    { icon: 'stethoscope', title: 'Doctors', text: 'A calm daily queue, one-screen consultation notes and full patient history.', points: ['Today’s queue', 'Rx & vitals', 'Own schedule'] },
    { icon: 'badge', title: 'Staff', text: 'Front desk and billing in one place: walk-ins, check-ins and invoices.', points: ['Walk-in booking', 'Check-in', 'Invoices'] },
  ];
  steps = [
    { icon: 'person_add', title: 'Create your account', text: 'One short form. Your record is ready instantly.' },
    { icon: 'calendar_month', title: 'Pick a doctor & time', text: 'Only real free slots are shown — no double booking.' },
    { icon: 'clinical_notes', title: 'Visit & follow up', text: 'Notes, prescriptions and the bill appear in your portal.' },
  ];
  year = new Date().getFullYear();
}
