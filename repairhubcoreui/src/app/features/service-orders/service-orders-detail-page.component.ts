import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceOrdersService } from '../../shared/services/service-orders.service';
import { ServiceOrders } from '../../shared/models/ServiceOrders';
import { ServiceOrdersDetailComponent } from './service-orders-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-orders-detail-page',
  standalone: true,
  imports: [CommonModule, ServiceOrdersDetailComponent],
  template: `
    
    <app-service-orders-detail 
    [serviceOrder]="serviceOrder"
    (back)="goBack()"
    (edit)="onEdit()"
      ></app-service-orders-detail>
    
  `,
})
export class ServiceOrdersDetailPageComponent {
  serviceOrder: ServiceOrders | null = null;

  constructor(
    private service: ServiceOrdersService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(o => (this.serviceOrder = o));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.serviceOrder) {
      this.router.navigate(['../', this.serviceOrder.id, 'edit'], { relativeTo: this.route });
    }
  }
}
