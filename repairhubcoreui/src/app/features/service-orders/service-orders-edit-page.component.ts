import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceOrdersService } from '../../shared/services/service-orders.service';
import { ServiceOrders } from '../../shared/models/ServiceOrders';
import { ServiceOrdersFormComponent } from './service-orders-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-orders-edit-page',
  standalone: true,
  imports: [CommonModule, ServiceOrdersFormComponent],
  template: `
    
    <app-service-orders-form
      [serviceOrder]="serviceOrder"
      (save)="onSave($event)"
    ></app-service-orders-form>
  `,
})
export class ServiceOrdersEditPageComponent {
  serviceOrder: ServiceOrders | null = null;
  isNew = false;

  constructor(
    private service: ServiceOrdersService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(o => (this.serviceOrder = o));
    }
  }

  onSave(data: Partial<ServiceOrders>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.serviceOrder) {
      this.service.update(this.serviceOrder.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }
}
