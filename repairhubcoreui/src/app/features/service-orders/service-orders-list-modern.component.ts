import { Component, signal, computed, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ServiceOrders } from '../../shared/models/ServiceOrders';
import { ServiceOrdersService } from '../../shared/services/service-orders.service';
import { AuthService } from '../../shared/services/auth.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

interface ListState {
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-service-orders-list-modern',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-orders-list-modern.component.html',
  styleUrls: ['./service-orders-list-modern.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ServiceOrdersListModernComponent implements OnInit, OnDestroy {
  private serviceOrdersService = inject(ServiceOrdersService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  readonly listState = signal<ListState>({ isLoading: false, error: null });
  readonly serviceOrders = signal<ServiceOrders[]>([]);
  readonly searchQuery = signal('');
  readonly filterStatus = signal<'all' | 'active' | 'completed' | 'canceled'>('active');
  readonly filterDevice = signal<number | 0>(0);
  readonly filterStore = signal<number | 0>(0);
  readonly filterSubStatus = signal<string>('all');
  readonly filtersExpanded = signal(false);
  readonly sortBy = signal<'orderCode' | 'customer' | 'date' | 'totalCost'>('date');

  // View mode: 'professional' is the default (2026 professional list view)
  readonly viewMode = signal<'professional' | 'modern'>('professional');
  readonly isProfessional = computed(() => this.viewMode() === 'professional');

  isLoading = computed(() => this.listState().isLoading);
  error = computed(() => this.listState().error);
  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.filterStatus() !== 'active') count += 1;
    if (this.filterDevice() !== 0) count += 1;
    if (this.filterStore() !== 0) count += 1;
    if (this.filterSubStatus() !== 'all') count += 1;
    return count;
  });

  filteredServiceOrders = computed(() => {
    const orders = this.serviceOrders();
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    const deviceId = this.filterDevice();
    const storeId = this.filterStore();
    const subStatus = this.filterSubStatus();
    const sortField = this.sortBy();

    let filtered = orders.filter(order => {
      // Search: order code, customer, serial, device, brand and model
      const matchesSearch = !query || 
        order.orderCode.toLowerCase().includes(query) ||
        `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.toLowerCase().includes(query) ||
        (order.serial || '').toLowerCase().includes(query) ||
        (order.device?.name || '').toLowerCase().includes(query) ||
        (order.deviceBrand?.name || '').toLowerCase().includes(query) ||
        (order.model || '').toLowerCase().includes(query);

      // Status filter
      let matchesStatus = true;
      if (status === 'active') {
        matchesStatus = !order.cloused && !order.canceled;
      } else if (status === 'completed') {
        matchesStatus = order.cloused;
      } else if (status === 'canceled') {
        matchesStatus = order.canceled;
      }

      const matchesDevice = deviceId === 0 || order.deviceId === deviceId;
      const matchesStore = storeId === 0 || order.storeId === storeId;
      const matchesSubStatus = subStatus === 'all' || this.getLatestRepairStatus(order) === subStatus;

      return matchesSearch && matchesStatus && matchesDevice && matchesStore && matchesSubStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortField) {
        case 'orderCode':
          return a.orderCode.localeCompare(b.orderCode);
        case 'customer':
          const nameA = `${a.customer?.firstName || ''} ${a.customer?.lastName || ''}`;
          const nameB = `${b.customer?.firstName || ''} ${b.customer?.lastName || ''}`;
          return nameA.localeCompare(nameB);
        case 'totalCost':
          return b.totalCost - a.totalCost;
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    // Role-based visibility: Experts (non center-admin) see only their orders
    const employee = this.authService.getCurrentEmployee();
    if (employee && employee.employee_type === 'Expert' && !employee.isCenterAdmin) {
      filtered = filtered.filter(o => o.createdById === employee.id || o.assignedTechId === employee.id);
    }

    return filtered;
  });


  isEmptyState = computed(() => this.filteredServiceOrders().length === 0 && !this.isLoading());

  ngOnInit(): void {
    this.loadServiceOrders();

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.searchQuery.set(query);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadServiceOrders(useCache = true): void {
    this.listState.update(s => ({ ...s, isLoading: true, error: null }));

    this.serviceOrdersService.getAll(useCache)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.serviceOrders.set(data || []);
          this.listState.update(s => ({ ...s, isLoading: false }));
        },
        error: (err) => {
          this.listState.update(s => ({
            ...s,
            isLoading: false,
            error: err?.error?.message || 'Error loading service orders'
          }));
        }
      });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  refreshList(): void {
    this.loadServiceOrders(false);
  }

  toggleFilters(): void {
    this.filtersExpanded.update(value => !value);
  }

  clearFilters(): void {
    this.filterStatus.set('active');
    this.filterDevice.set(0);
    this.filterStore.set(0);
    this.filterSubStatus.set('all');
  }

  onFilterChange(status: 'all' | 'active' | 'completed' | 'canceled'): void {
    this.filterStatus.set(status);
  }

  onDeviceFilterChange(deviceId: string): void {
    this.filterDevice.set(Number(deviceId));
  }

  onStoreFilterChange(storeId: string): void {
    this.filterStore.set(Number(storeId));
  }

  onSubStatusFilterChange(subStatus: string): void {
    this.filterSubStatus.set(subStatus);
  }

  onSortChange(field: 'orderCode' | 'customer' | 'date' | 'totalCost'): void {
    this.sortBy.set(field);
  }

  goToNew(): void {
    this.router.navigate(['/service-orders/new']);
  }

  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'professional' ? 'modern' : 'professional');
  }

  goToEdit(order: ServiceOrders): void {
    this.router.navigate(['/service-orders', order.id, 'edit']);
  }

  goToDetail(order: ServiceOrders): void {
    this.router.navigate(['/service-orders', order.id]);
  }

  deleteServiceOrder(order: ServiceOrders): void {
    (async () => {
      const ok = await this.showConfirm(`Delete order ${order.orderCode}`,
        `Are you sure you want to delete order ${order.orderCode}?`);
      if (!ok) return;
      this.serviceOrdersService.delete(order.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.serviceOrders.update(orders => orders.filter(o => o.id !== order.id));
        },
        error: (err) => {
          this.listState.update(s => ({
            ...s,
            error: err?.error?.message || 'Error deleting order'
          }));
        }
      });
    })();
  }

  resendOrderEmail(order: ServiceOrders): void {
    if (!order || !order.id) return;
    (async () => {
      const ok = await this.showConfirm(`Resend email ${order.orderCode}`,
        `Resend creation email for order ${order.orderCode}?`);
      if (!ok) return;

      this.listState.update(s => ({ ...s, isLoading: true, error: null }));
      this.serviceOrdersService.resendEmail(order.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.listState.update(s => ({ ...s, isLoading: false }));
          this.listState.update(s => ({ ...s, error: null }));
        },
        error: (err) => {
          this.listState.update(s => ({ ...s, isLoading: false, error: err?.error?.message || 'Error resending email' }));
        }
      });
    })();
  }

  // --- Modal confirm implementation using signals ---
  readonly modalVisible = signal(false);
  readonly modalTitle = signal('');
  readonly modalMessage = signal('');
  private modalResolver: ((value: boolean) => void) | null = null;

  showConfirm(title: string, message: string): Promise<boolean> {
    this.modalTitle.set(title);
    this.modalMessage.set(message);
    this.modalVisible.set(true);
    return new Promise<boolean>(resolve => {
      this.modalResolver = resolve;
    });
  }

  onConfirmModal(): void {
    if (this.modalResolver) this.modalResolver(true);
    this.modalResolver = null;
    this.modalVisible.set(false);
  }

  onCancelModal(): void {
    if (this.modalResolver) this.modalResolver(false);
    this.modalResolver = null;
    this.modalVisible.set(false);
  }

  getStatusBadge(order: ServiceOrders): string {
    if (order.canceled) return 'Canceled';
    if (order.cloused) return 'Completed';
    return 'Active';
  }

  getStatusClass(order: ServiceOrders): string {
    if (order.canceled) return 'status-canceled';
    if (order.cloused) return 'status-completed';
    return 'status-active';
  }

  // Bootstrap badge classes for visual status (kept separate to preserve existing custom classes)
  getStatusBadgeClass(order: ServiceOrders): string {
    if (order.canceled) return 'bg-danger text-white';
    if (order.cloused) return 'bg-success text-white';
    return 'bg-primary text-white';
  }

  getLatestRepairStatus(order: ServiceOrders): string {
    return order.lastRepairStatus?.status || 'No status';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  readonly deviceFilterOptions = computed(() => {
    const byId = new Map<number, string>();
    this.serviceOrders().forEach(order => {
      if (order.deviceId && order.device?.name) {
        byId.set(order.deviceId, order.device.name);
      }
    });
    return Array.from(byId.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly storeFilterOptions = computed(() => {
    const byId = new Map<number, string>();
    this.serviceOrders().forEach(order => {
      if (order.storeId && order.store?.storeName) {
        byId.set(order.storeId, order.store.storeName);
      }
    });
    return Array.from(byId.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly subStatusFilterOptions = computed(() => {
    const statuses = new Set<string>();
    this.serviceOrders().forEach(order => {
      const status = this.getLatestRepairStatus(order);
      if (status) {
        statuses.add(status);
      }
    });
    return Array.from(statuses).sort((a, b) => a.localeCompare(b));
  });
}
