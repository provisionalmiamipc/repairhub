import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ServiceOrderRequeste } from '../../shared/models/ServiceOrderRequeste';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-order-requeste-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-order-requeste-list.component.html',
})
export class ServiceOrderRequesteListComponent {
  @Input() requests: ServiceOrderRequeste[] = [];
  @Output() select = new EventEmitter<ServiceOrderRequeste>();
  @Output() edit = new EventEmitter<ServiceOrderRequeste>();
  @Output() delete = new EventEmitter<ServiceOrderRequeste>();
}
