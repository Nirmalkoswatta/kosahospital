import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-visual',
  imports: [RouterLink],
  
  template: `
    <a routerLink="/" class="brand"><span class="logo"><span class="mi fill" aria-hidden="true">local_hospital</span></span> Kosa Hospital</a>
    <div class="stack3d" aria-hidden="true">
      <div class="fcard"><span class="mi">event_available</span><div><strong>Appointment confirmed</strong><div class="small">Tomorrow · 09:30</div></div></div>
      <div class="fcard"><span class="mi">prescriptions</span><div><strong>New prescription</strong><div class="small">Dr. Perera</div></div></div>
      <div class="fcard"><span class="mi">receipt_long</span><div><strong>Invoice paid</strong><div class="small">LKR 5,300</div></div></div>
    </div>
    <div>
      <h2>{{ heading() }}</h2>
      <p>{{ text() }}</p>
    </div>
  `,
  styleUrl: './auth-visual.scss',
})
export class AuthVisual {
  heading = input('');
  text = input('');
}
