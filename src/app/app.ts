import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Notifications } from './shared/notifications/notifications';
import { NotificationBanner } from './shared/notification-banner/notification-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationBanner, Notifications],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('hospital-management');
}
