import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersItemService } from '../../shared/services/orders-item.service';
import { OrdersItem } from '../../shared/models/OrdersItem';
import { OrdersItemListComponent } from './orders-item-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders-item-list-page',
  standalone: true,
  imports: [CommonModule, OrdersItemListComponent],
  template: `
    <h1>Items de Orden</h1>
    <button (click)="onCreate()">New Item</button>
    <app-orders-item-list
      [ordersItems]="ordersItems"
      (select)="onSelect($event)"
      (edit)="onEdit($event)"
      (delete)="onDelete($event)"
    ></app-orders-item-list>
  `,
})
export class OrdersItemListPageComponent {
  ordersItems: OrdersItem[] = [];

  constructor(
    private service: OrdersItemService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.load();
  }

  load() {
    this.service.getAll().subscribe(items => (this.ordersItems = items));
  }

  onSelect(item: OrdersItem) {
    this.router.navigate(['./', item.id], { relativeTo: this.route });
  }

  onEdit(item: OrdersItem) {
    this.router.navigate(['./', item.id, 'edit'], { relativeTo: this.route });
  }

  onDelete(item: OrdersItem) {
    if (confirm('Delete this item?')) {
      this.service.delete(item.id).subscribe(() => this.load());
    }
  }

  onCreate() {
    this.router.navigate(['./new'], { relativeTo: this.route });
  }
}
