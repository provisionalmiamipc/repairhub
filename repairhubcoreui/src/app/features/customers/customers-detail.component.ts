import { Component } from '@angular/core';
import { Customers } from '../../shared/models/Customers';
import { CommonModule } from '@angular/common';
import { CustomersService } from '../../shared/services/customers.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ServiceOrders } from '../../shared/models/ServiceOrders';
import { ServiceOrdersService } from '../../shared/services/service-orders.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-customers-detail',
  standalone: true,
  templateUrl: './customers-detail.component.html',
  imports: [CommonModule, RouterLink],
  styles: [`
    .service-order-history {
      max-height: 360px;
      overflow-y: auto;
      border: 1px solid var(--cui-border-color, #d8dbe0);
      border-radius: .5rem;
    }

    .service-order-history-item {
      display: grid;
      grid-template-columns: 8.5rem minmax(0, 1fr) 7.5rem;
      gap: 1rem;
      align-items: center;
      padding: .85rem 1rem;
      border-bottom: 1px solid var(--cui-border-color, #d8dbe0);
      text-decoration: none;
      color: inherit;
    }

    .service-order-history-item:last-child {
      border-bottom: 0;
    }

    .service-order-history-item:hover {
      background: var(--cui-tertiary-bg, #f8f9fa);
    }

    .order-device {
      min-width: 0;
    }

    @media (max-width: 767.98px) {
      .service-order-history-item {
        grid-template-columns: minmax(0, 1fr) 7rem;
      }

      .order-device {
        grid-column: 1 / -1;
      }
    }
  `],
})
export class CustomersDetailComponent {
  //@Input() customer!: Customers;
  customer: Customers | null = null;
  serviceOrders: ServiceOrders[] = [];
  isLoadingOrders = false;
  ordersError = '';

  constructor(
    private customerService: CustomersService,
    private serviceOrdersService: ServiceOrdersService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {

    // Ejemplo: cargar desde un servicio
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const customerId = +id;
      this.customerService.getById(customerId).subscribe(cus => this.customer = cus);
      this.loadServiceOrders(customerId);
    }

  }

  private loadServiceOrders(customerId: number): void {
    this.isLoadingOrders = true;
    this.ordersError = '';

    this.serviceOrdersService.getByCustomer(customerId)
      .pipe(finalize(() => this.isLoadingOrders = false))
      .subscribe({
        next: orders => {
          this.serviceOrders = [...(orders || [])].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        },
        error: () => {
          this.serviceOrders = [];
          this.ordersError = 'Could not load service orders for this customer.';
        },
      });
  }

  editCustomer() {
    // Navigate to edit page or open edit modal
    if (this.customer)
      this.router.navigate(['../', this.customer?.id, 'edit'], { relativeTo: this.route });
  }

  close(): void {
    // Navegar atrás o limpiar
    window.history.back();
  }

  getOrderStatus(order: ServiceOrders): string {
    if (order.canceled) return 'Canceled';
    if (order.cloused) return 'Closed';
    return order.lastRepairStatus?.status || 'Active';
  }

  getOrderStatusClass(order: ServiceOrders): string {
    if (order.canceled) return 'bg-danger';
    if (order.cloused) return 'bg-success';
    return 'bg-primary';
  }

  getDeviceSummary(order: ServiceOrders): string {
    const parts = [
      order.device?.name,
      order.deviceBrand?.name,
      order.model,
    ].filter(Boolean);

    return parts.length ? parts.join(' · ') : 'No device information';
  }

  formatCurrency(value: number | string | null | undefined): string {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}
