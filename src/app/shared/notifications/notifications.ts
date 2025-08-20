import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class Notifications {
  constructor(public ns: NotificationService) {}
}
