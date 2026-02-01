import { Component, Input } from '@angular/core';
import { OrdersItem } from '../../shared/models/OrdersItem';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders-item-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders-item-detail.component.html',
})
export class OrdersItemDetailComponent {
  @Input() ordersItem: OrdersItem | null = null;
}
