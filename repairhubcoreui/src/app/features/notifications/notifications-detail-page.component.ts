import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { NotificationsService } from '../../shared/services/notifications.service';
import { Notifications } from '../../shared/models/Notifications';

@Component({
  selector: 'app-notifications-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications-detail-page.component.html',
})
export class NotificationsDetailPageComponent implements OnInit {
  notification?: Notifications;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.notificationsService.getById(id).subscribe({
      next: (data) => { this.notification = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
