import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersItemService } from '../../shared/services/orders-item.service';
import { OrdersItem } from '../../shared/models/OrdersItem';
import { OrdersItemFormComponent } from './orders-item-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders-item-edit-page',
  standalone: true,
  imports: [CommonModule, OrdersItemFormComponent],
  template: `
    <h1 *ngIf="!isNew">Editar Item</h1>
    <h1 *ngIf="isNew">Nuevo Item</h1>
    <app-orders-item-form
      [ordersItem]="ordersItem"
      (save)="onSave($event)"
    ></app-orders-item-form>
  `,
})
export class OrdersItemEditPageComponent {
  ordersItem: OrdersItem | null = null;
  isNew = false;

  constructor(
    private service: OrdersItemService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(o => (this.ordersItem = o));
    }
  }

  onSave(data: Partial<OrdersItem>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.ordersItem) {
      this.service.update(this.ordersItem.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }
}
