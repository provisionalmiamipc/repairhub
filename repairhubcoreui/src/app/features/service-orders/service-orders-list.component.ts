import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ServiceOrders } from '../../shared/models/ServiceOrders';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { CardComponent } from '@coreui/angular';

@Component({
  selector: 'app-service-orders-list',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './service-orders-list.component.html',
})
export class ServiceOrdersListComponent {
  @Input() items: Observable<ServiceOrders[]> | null = null;
  @Output() selectServiceOrder = new EventEmitter<ServiceOrders>();
  @Output() editServiceOrder = new EventEmitter<ServiceOrders>();
  @Output() deleteServiceOrder = new EventEmitter<ServiceOrders>();

  onSelect(order: ServiceOrders): void {
    this.selectServiceOrder.emit(order);
  }

  onEdit(order: ServiceOrders): void {
    this.editServiceOrder.emit(order);
  }

  onDelete(order: ServiceOrders): void {
    this.deleteServiceOrder.emit(order);
  }
}


