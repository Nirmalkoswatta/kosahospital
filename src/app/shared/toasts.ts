import { Component, inject } from '@angular/core';
import { NotificationService } from '../core/notification.service';

const ICON = { success: 'check_circle', error: 'error', info: 'info', warn: 'warning' } as const;

@Component({
  selector: 'app-toasts',
  template: `
    <div class="toasts" role="status" aria-live="polite">
      @for (t of ns.list(); track t.id) {
        <div class="toast" [class]="'toast ' + t.type">
          <span class="mi" aria-hidden="true">{{ icon[t.type] }}</span>
          <div class="grow">
            @if (t.title) { <strong>{{ t.title }}</strong> }
            <div>{{ t.message }}</div>
          </div>
          <button class="icon-btn" (click)="ns.remove(t.id)" aria-label="Dismiss notification">
            <span class="mi" aria-hidden="true">close</span>
          </button>
        </div>
      }
    </div>
  `,
})
export class Toasts {
  ns = inject(NotificationService);
  icon = ICON;
}
