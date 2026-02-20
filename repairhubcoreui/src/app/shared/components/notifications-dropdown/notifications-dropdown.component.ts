import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationsService } from '../../services/notifications.service';
import { AuthService } from '../../services/auth.service';
import { Notifications } from '../../models/Notifications';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-notifications-dropdown',
  templateUrl: './notifications-dropdown.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class NotificationsDropdownComponent implements OnInit, OnDestroy {
  notifications: Notifications[] = [];
  unreadCount: number = 0;
  private employeeId: number | null = null;

  // exposición para la plantilla
  public svc!: NotificationsService
  public menuOpen = false;

  constructor(
    private notificationsSvc: NotificationsService,
    private auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.svc = this.notificationsSvc; // assign service early for template usage
    this.employeeId = this.auth.getEmployeeId ? this.auth.getEmployeeId() : null;
    if (this.employeeId) {
      await this.notificationsSvc.loadMy(this.employeeId);
    }
    this.notifications = this.notificationsSvc.notifications();
    this.unreadCount = this.notificationsSvc.unreadCount();
  }

  ngOnDestroy(): void {
    // cleanup si es necesario (el servicio maneja socket)
  }

  get unreadNotifications(): Notifications[] {
    return this.svc ? this.svc.notifications().filter(n => n.status === 'unread') : [];
  }

  async open(n: Notifications): Promise<void> {
    if (n.status === 'unread') {
      try {
        await this.notificationsSvc.markRead(n.id);
      } catch {
        // ignore errors
      }
    }
    if (n.actionUrl) {
      this.router.navigateByUrl(n.actionUrl).catch(() => {});
    }
    // close menu after opening/handling
    this.menuOpen = false;
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // close when clicking outside
    if (this.menuOpen) {
      this.menuOpen = false;
    }
  }

  getBadgeClass(n: Notifications): string {
    switch (n.type) {
      case 'alert':
        return 'badge bg-danger';
      case 'reminder':
        return 'badge bg-warning text-dark';
      case 'announcement':
        return 'badge bg-info text-dark';
      case 'task':
        return 'badge bg-primary';
      default:
        return 'badge bg-secondary';
    }
  }

  trackById(_: number, item: Notifications): number {
    return Number(item.id);
  }
}