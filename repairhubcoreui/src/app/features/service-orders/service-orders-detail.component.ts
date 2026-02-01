import { Component, Input, Output, EventEmitter  } from '@angular/core';
import { ServiceOrders } from '../../shared/models/ServiceOrders';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-service-orders-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-orders-detail.component.html',
})
export class ServiceOrdersDetailComponent {
  @Input() serviceOrder: ServiceOrders | null = null;
  @Output() back = new EventEmitter();
  @Output() edit = new EventEmitter(); 
}
