import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationsService } from '../../shared/services/notifications.service';
import { Notifications } from '../../shared/models/Notifications';

@Component({
  selector: 'app-notifications-list-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications-list-page.component.html',
})
export class NotificationsListPageComponent implements OnInit {
  notifications: Notifications[] = [];
  loading = false;

  constructor(private notificationsService: NotificationsService) {}

  ngOnInit(): void {
    this.loading = true;
    this.notificationsService.getAll().subscribe({
      next: (data) => { this.notifications = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
