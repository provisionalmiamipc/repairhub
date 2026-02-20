import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../../shared/services/orders.service';
import { Orders } from '../../shared/models/Orders';
import { OrdersDetailComponent } from './orders-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders-detail-page',
  standalone: true,
  imports: [CommonModule, OrdersDetailComponent],
  template: `
    <h1>Detalle de Orden</h1>
    <app-orders-detail [order]="order"></app-orders-detail>
    <button (click)="goBack()">Back</button>
    <button (click)="onEdit()">Edit</button>
  `,
})
export class OrdersDetailPageComponent {
  order: Orders | null = null;

  constructor(
    private service: OrdersService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(o => (this.order = o));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.order) {
      this.router.navigate(['../', this.order.id, 'edit'], { relativeTo: this.route });
    }
  }
}
