import { Component, Input } from '@angular/core';
import { Orders } from '../../shared/models/Orders';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders-detail.component.html',
})
export class OrdersDetailComponent {
  @Input() order: Orders | null = null;
}
