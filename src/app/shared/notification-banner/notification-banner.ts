import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-notification-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="banner" *ngIf="ns.getBanner()() as msg">
      <div class="inner">{{ msg }}</div>
      <button class="close" (click)="ns.hideBanner()">×</button>
    </div>
  `,
  styles: [
    `:host { position: fixed; left: 0; right: 0; top: 0; z-index: 9998; pointer-events: none; }
    .banner { pointer-events: auto; margin: 0 auto; max-width: 1200px; background: #b91c1c; color: white; padding: 0.5rem 1rem; display:flex; align-items:center; justify-content:space-between; border-radius:0 0 8px 8px; }
    .banner .inner { font-weight:600; }
    .banner .close { background:transparent; border:none; color:white; font-size:1.2rem; cursor:pointer; }
    `
  ]
})
export class NotificationBanner {
  constructor(public ns: NotificationService) {}
}
