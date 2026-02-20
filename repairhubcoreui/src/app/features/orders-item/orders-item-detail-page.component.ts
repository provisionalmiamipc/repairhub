import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersItemService } from '../../shared/services/orders-item.service';
import { OrdersItem } from '../../shared/models/OrdersItem';
import { OrdersItemDetailComponent } from './orders-item-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders-item-detail-page',
  standalone: true,
  imports: [CommonModule, OrdersItemDetailComponent],
  template: `
    <h1>Detalle de Item</h1>
    <app-orders-item-detail [ordersItem]="ordersItem"></app-orders-item-detail>
    <button (click)="goBack()">Volver</button>
    <button (click)="onEdit()">Edit</button>
  `,
})
export class OrdersItemDetailPageComponent {
  ordersItem: OrdersItem | null = null;

  constructor(
    private service: OrdersItemService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(o => (this.ordersItem = o));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.ordersItem) {
      this.router.navigate(['../', this.ordersItem.id, 'edit'], { relativeTo: this.route });
    }
  }
}
