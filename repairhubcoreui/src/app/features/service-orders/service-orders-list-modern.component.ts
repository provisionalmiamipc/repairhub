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
  readonly filterStatus = signal<'all' | 'active' | 'completed' | 'canceled'>('all');
  readonly filterLock = signal<'all' | 'locked' | 'unlocked'>('all');
  readonly sortBy = signal<'orderCode' | 'customer' | 'date' | 'totalCost'>('date');

  isLoading = computed(() => this.listState().isLoading);
  error = computed(() => this.listState().error);

  filteredServiceOrders = computed(() => {
    const orders = this.serviceOrders();
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    const lock = this.filterLock();
    const sortField = this.sortBy();

    let filtered = orders.filter(order => {
      // Search: order code, customer name
      const matchesSearch = !query || 
        order.orderCode.toLowerCase().includes(query) ||
        `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.toLowerCase().includes(query) ||
        order.serial?.toLowerCase().includes(query);

      // Status filter
      let matchesStatus = true;
      if (status === 'active') {
        matchesStatus = !order.cloused && !order.canceled;
      } else if (status === 'completed') {
        matchesStatus = order.cloused;
      } else if (status === 'canceled') {
        matchesStatus = order.canceled;
      }

      // Lock filter
      const matchesLock = lock === 'all' || (lock === 'locked' && order.lock) || (lock === 'unlocked' && !order.lock);

      return matchesSearch && matchesStatus && matchesLock;
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

  private loadServiceOrders(): void {
    this.listState.update(s => ({ ...s, isLoading: true, error: null }));

    this.serviceOrdersService.getAll()
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
            error: err?.error?.message || 'Error al cargar órdenes de servicio'
          }));
        }
      });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onFilterChange(status: 'all' | 'active' | 'completed' | 'canceled'): void {
    this.filterStatus.set(status);
  }

  onLockFilterChange(lock: 'all' | 'locked' | 'unlocked'): void {
    this.filterLock.set(lock);
  }

  onSortChange(field: 'orderCode' | 'customer' | 'date' | 'totalCost'): void {
    this.sortBy.set(field);
  }

  goToNew(): void {
    this.router.navigate(['/service-orders/new']);
  }

  goToEdit(order: ServiceOrders): void {
    this.router.navigate(['/service-orders', order.id, 'edit']);
  }

  goToDetail(order: ServiceOrders): void {
    this.router.navigate(['/service-orders', order.id]);
  }

  deleteServiceOrder(order: ServiceOrders): void {
    (async () => {
      const ok = await this.showConfirm(`Eliminar orden ${order.orderCode}`,
        `¿Está seguro que desea eliminar la orden ${order.orderCode}?`);
      if (!ok) return;
      this.serviceOrdersService.delete(order.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.serviceOrders.update(orders => orders.filter(o => o.id !== order.id));
        },
        error: (err) => {
          this.listState.update(s => ({
            ...s,
            error: err?.error?.message || 'Error al eliminar la orden'
          }));
        }
      });
    })();
  }

  resendOrderEmail(order: ServiceOrders): void {
    if (!order || !order.id) return;
    (async () => {
      const ok = await this.showConfirm(`Reenviar correo ${order.orderCode}`,
        `Reenviar correo de creación para la orden ${order.orderCode}?`);
      if (!ok) return;

      this.listState.update(s => ({ ...s, isLoading: true, error: null }));
      this.serviceOrdersService.resendEmail(order.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.listState.update(s => ({ ...s, isLoading: false }));
          this.listState.update(s => ({ ...s, error: null }));
        },
        error: (err) => {
          this.listState.update(s => ({ ...s, isLoading: false, error: err?.error?.message || 'Error al reenviar correo' }));
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
    if (order.canceled) return 'Cancelada';
    if (order.cloused) return 'Completada';
    return 'Activa';
  }

  getStatusClass(order: ServiceOrders): string {
    if (order.canceled) return 'status-canceled';
    if (order.cloused) return 'status-completed';
    return 'status-active';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}
