import { Component, Input, Output, EventEmitter } from '@angular/core';
import { OrdersItem } from '../../shared/models/OrdersItem';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders-item-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders-item-list.component.html',
})
export class OrdersItemListComponent {
  @Input() ordersItems: OrdersItem[] = [];
  @Output() select = new EventEmitter<OrdersItem>();
  @Output() edit = new EventEmitter<OrdersItem>();
  @Output() delete = new EventEmitter<OrdersItem>();
}
