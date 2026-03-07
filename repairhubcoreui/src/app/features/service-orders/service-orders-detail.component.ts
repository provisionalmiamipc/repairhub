import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ServiceOrders } from '../../shared/models/ServiceOrders';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { RepairCopilotWidgetComponent } from './components/repair-copilot-widget/repair-copilot-widget.component';


@Component({
  selector: 'app-service-orders-detail',
  standalone: true,
  imports: [CommonModule, RepairCopilotWidgetComponent],
  templateUrl: './service-orders-detail.component.html',
})
export class ServiceOrdersDetailComponent {
  @Input() serviceOrder: ServiceOrders | null = null;
  @Output() back = new EventEmitter();
  @Output() edit = new EventEmitter(); 

  public authService = inject(AuthService);

  // trackBy helper for ngFor
  trackById(index: number, item: any) {
    return item?.id ?? index;
  }
}
