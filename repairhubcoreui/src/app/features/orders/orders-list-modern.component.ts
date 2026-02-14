import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Orders } from '../../shared/models/Orders';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { Customers } from '../../shared/models/Customers';
import { OrdersService } from '../../shared/services/orders.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { CustomersService } from '../../shared/services/customers.service';

interface ListState {
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-orders-list-modern',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders-list-modern.component.html',
  styleUrl: './orders-list-modern.component.scss',
})
export class OrdersListModernComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private customersService = inject(CustomersService);
  private router = inject(Router);

  readonly listState = signal<ListState>({ isLoading: false, error: null });
  readonly orders = signal<Orders[]>([]);
  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);
  readonly customers = signal<Customers[]>([]);
  
  readonly searchQuery = signal('');
  readonly filterStatus = signal<'all' | 'active' | 'closed' | 'canceled'>('all');
  readonly sortBy = signal<'id' | 'totalPrice' | 'date'>('date');

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  readonly filteredOrders = computed(() => {
    const allOrders = this.orders();
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    const sort = this.sortBy();

    let filtered = allOrders.filter(order => {
      const matchesSearch = !query || 
        order.id.toString().includes(query) ||
        this.getCustomerName(order).toLowerCase().includes(query);

      const matchesStatus = status === 'all' || 
        (status === 'active' && !order.cloused && !order.canceled) ||
        (status === 'closed' && order.cloused) ||
        (status === 'canceled' && order.canceled);

      return matchesSearch && matchesStatus;
    });

    if (sort === 'id') {
      filtered.sort((a, b) => b.id - a.id);
    } else if (sort === 'totalPrice') {
      filtered.sort((a, b) => b.totalPrice - a.totalPrice);
    } else {
      filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return filtered;
  });

  readonly isEmptyState = computed(() => this.filteredOrders().length === 0 && !this.listState().isLoading);

  ngOnInit() {
    this.loadAllData();
    
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => this.searchQuery.set(query));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAllData() {
    this.listState.update(s => ({ ...s, isLoading: true }));
    
    Promise.all([
      this.loadOrders(),
      this.loadCenters(),
      this.loadStores(),
      this.loadCustomers(),
    ])
      .catch(error => {
        this.listState.update(s => ({ ...s, error: error.message }));
      })
      .finally(() => {
        this.listState.update(s => ({ ...s, isLoading: false }));
      });
  }

  private loadOrders() {
    return this.ordersService.getAll().toPromise().then(data => {
      this.orders.set(data || []);
    });
  }

  private loadCenters() {
    return this.centersService.getAll().toPromise().then(data => {
      this.centers.set(data || []);
    });
  }

  private loadStores() {
    return this.storesService.getAll().toPromise().then(data => {
      this.stores.set(data || []);
    });
  }

  private loadCustomers() {
    return this.customersService.getAll().toPromise().then(data => {
      this.customers.set(data || []);
    });
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  onFilterChange(value: string) {
    this.filterStatus.set(value as 'all' | 'active' | 'closed' | 'canceled');
  }

  onSortChange(field: string) {
    this.sortBy.set(field as 'id' | 'totalPrice' | 'date');
  }

  getCustomerName(order: Orders): string {
    if (order.customer) {
      return `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim();
    }
    return 'N/A';
  }

  getCenterName(order: Orders): string {
    return order.center?.centerName || 'N/A';
  }

  getStoreName(order: Orders): string {
    return order.store?.storeName || 'N/A';
  }

  getPaymentTypeName(order: Orders): string {
    return order.paymentType?.type || 'N/A';
  }

  getOrderStatus(order: Orders): 'active' | 'closed' | 'canceled' {
    if (order.canceled) return 'canceled';
    if (order.cloused) return 'closed';
    return 'active';
  }

  getTotalPending(order: Orders): number {
    return order.totalPrice - order.advancePayment;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  editOrder(order: Orders) {
    this.router.navigate(['/orders', order.id, 'edit']);
  }

  viewOrder(order: Orders) {
    this.router.navigate(['/orders', order.id]);
  }

  deleteOrder(order: Orders) {
    if (confirm(`Delete order #${order.id}?`)) {
      this.ordersService.delete(order.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.orders.update(orders => orders.filter(o => o.id !== order.id));
        },
        error: (err) => {
          alert(`Error deleting: ${err.message}`);
        }
      });
    }
  }

  createNew() {
    this.router.navigate(['/orders', 'new']);
  }

  retryLoad() {
    this.loadAllData();
  }
}
