import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TrackOrderComponent } from '../track-order/track-order.component';

@Component({
  selector: 'app-service-status-root',
  standalone: true,
  imports: [CommonModule, TrackOrderComponent],
  template: `
    <app-track-order *ngIf="isServiceStatusHost"></app-track-order>
  `,
})
export class ServiceStatusRootComponent implements OnInit {
  private readonly router = inject(Router);
  isServiceStatusHost = false;

  ngOnInit(): void {
    this.isServiceStatusHost = this.isPublicStatusHost();

    if (!this.isServiceStatusHost) {
      this.router.navigate(['/login']);
    }
  }

  private isPublicStatusHost(): boolean {
    const hostname = window.location.hostname || '';
    return hostname.startsWith('status.') ||
      hostname.startsWith('repair-status.') ||
      hostname.startsWith('track.');
  }
}
