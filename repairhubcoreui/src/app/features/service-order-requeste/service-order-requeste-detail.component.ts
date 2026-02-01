import { Component, Input } from '@angular/core';
import { ServiceOrderRequeste } from '../../shared/models/ServiceOrderRequeste';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-order-requeste-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-order-requeste-detail.component.html',
})
export class ServiceOrderRequesteDetailComponent {
  @Input() request: ServiceOrderRequeste | null = null;
}
