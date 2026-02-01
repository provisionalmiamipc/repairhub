import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Orders } from '../../shared/models/Orders';
import { CardModule } from '@coreui/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './orders-list.component.html',
})
export class OrdersListComponent {
  @Input() items: Observable<Orders[]> | null = null;
  @Output() selectOrder = new EventEmitter<Orders>();
  @Output() editOrder = new EventEmitter<Orders>();
  @Output() deleteOrder = new EventEmitter<Orders>();
}
