import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceOrderRequesteService } from '../../shared/services/service-order-requeste.service';
import { ServiceOrderRequeste } from '../../shared/models/ServiceOrderRequeste';
import { ServiceOrderRequesteListComponent } from './service-order-requeste-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-order-requeste-list-page',
  standalone: true,
  imports: [CommonModule, ServiceOrderRequesteListComponent],
  template: `
    <h1>Service Order Requests</h1>
    <button (click)="onCreate()">New Request</button>
    <app-service-order-requeste-list
      [requests]="requests"
      (select)="onSelect($event)"
      (edit)="onEdit($event)"
      (delete)="onDelete($event)"
    ></app-service-order-requeste-list>
  `,
})
export class ServiceOrderRequesteListPageComponent {
  requests: ServiceOrderRequeste[] = [];

  constructor(
    private service: ServiceOrderRequesteService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.load();
  }

  load() {
    this.service.getAll().subscribe(requests => (this.requests = requests));
  }

  onSelect(request: ServiceOrderRequeste) {
    this.router.navigate(['./', request.id], { relativeTo: this.route });
  }

  onEdit(request: ServiceOrderRequeste) {
    this.router.navigate(['./', request.id, 'edit'], { relativeTo: this.route });
  }

  onDelete(request: ServiceOrderRequeste) {
    if (confirm('Delete this request?')) {
      this.service.delete(request.id).subscribe(() => this.load());
    }
  }

  onCreate() {
    this.router.navigate(['./new'], { relativeTo: this.route });
  }
}
