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

  async open(n: Notifications, event?: Event): Promise<void> {
    event?.preventDefault();
    event?.stopPropagation();

    if (n.status === 'unread') {
      // Do not block navigation on markRead request.
      void this.notificationsSvc.markRead(n.id).catch(() => {
        // ignore errors
      });
    }
    if (n.actionUrl) {
      //this.navigateFromActionUrl(n.actionUrl);
      this.router.navigate([n.actionUrl]).catch(() => {
        // fallback to raw URL if router fails
        this.navigateFromActionUrl(n.actionUrl!);
      });
    }
    // close menu after opening/handling
    this.menuOpen = false;
  }

  private navigateFromActionUrl(actionUrl: string): void {
    const raw = String(actionUrl || '').trim();
    if (!raw) return;

    // External URL
    if (/^https?:\/\//i.test(raw)) {
      window.location.href = raw;
      return;
    }

    // Internal route normalization (+ query/hash support)
    const normalized = raw.startsWith('/') ? raw : `/${raw}`;
    const [pathAndQuery, fragment = ''] = normalized.split('#');
    const [path, query = ''] = pathAndQuery.split('?');
    const segments = path.split('/').filter(Boolean);

    const queryParams: Record<string, string> = {};
    if (query) {
      const params = new URLSearchParams(query);
      params.forEach((value, key) => {
        queryParams[key] = value;
      });
    }

    this.router.navigate(['/', ...segments], {
      queryParams,
      fragment: fragment || undefined,
    }).catch(() => {
      this.router.navigateByUrl(normalized).catch(() => {
        // hard fallback for stubborn router state
        window.location.assign(normalized);
      });
    });
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
