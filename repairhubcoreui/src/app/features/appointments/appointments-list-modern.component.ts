import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Appointments } from '../../shared/models/Appointments';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { ServiceTypes } from '../../shared/models/ServiceTypes';
import { AuthService } from '../../shared/services/auth.service';
import { AppointmentsService } from '../../shared/services/appointments.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { ServiceTypesService } from '../../shared/services/service-types.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-appointments-list-modern',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments-list-modern.component.html',
  styleUrl: './appointments-list-modern.component.scss',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('cardEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class AppointmentsListModernComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private appointmentsService = inject(AppointmentsService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private serviceTypesService = inject(ServiceTypesService);
  private authService = inject(AuthService);

  // Signals State Management
  appointments = signal<Appointments[]>([]);
  centers = signal<Centers[]>([]);
  stores = signal<Stores[]>([]);
  serviceTypes = signal<ServiceTypes[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  filterStatus = signal('active'); // 'active', 'closed', 'canceled', 'all'
  sortBy = signal('date');

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Computed derived state
  filteredAppointments = computed(() => {
    const items = this.appointments();
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();

    let filtered = items.filter(item => {
      const matchesSearch =
        item.customer.toLowerCase().includes(query) ||
        item.notes.toLowerCase().includes(query) ||
        item.date.toLowerCase().includes(query);

      const matchesStatus = status === 'all' ||
        (status === 'active' && !item.cloused && !item.canceled) ||
        (status === 'closed' && item.cloused) ||
        (status === 'canceled' && item.canceled);

      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    const sortKey = this.sortBy();
    if (sortKey === 'date') {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortKey === 'customer') {
      filtered.sort((a, b) => a.customer.localeCompare(b.customer));
    } else if (sortKey === 'duration') {
      filtered.sort((a, b) => b.duration - a.duration);
    }

    return filtered;
  });

  readonly isExpertNonCenterAdmin = computed(() => {
    const employee = this.authService.getCurrentEmployee();
    return this.authService.isExpert() && !!employee && !(employee.isCenterAdmin ?? false);
  });

  isEmptyState = computed(() => this.filteredAppointments().length === 0 && !this.isLoading());

  ngOnInit() {
    this.loadAppointments();
    this.loadCenters();
    this.loadStores();
    this.loadServiceTypes();
    this.setupSearchListener();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAppointments() {
    this.isLoading.set(true);
    this.error.set(null);

    this.appointmentsService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          let list = data || [];
          // If current employee is Expert and NOT center admin, show only appointments assigned to them
          if (this.isExpertNonCenterAdmin()) {
            const empId = this.authService.getEmployeeId();
            if (empId != null) {
              list = (list || []).filter((a: any) => Number(a.assignedTechId) === Number(empId));
            }
          }
          this.appointments.set(list);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading appointments:', err);
          this.error.set('Error loading appointments. Please try again.');
          this.isLoading.set(false);
        }
      });
  }

  private loadCenters() {
    this.centersService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.centers.set(data || []),
      error: () => this.centers.set([])
    });
  }

  private loadStores() {
    this.storesService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.stores.set(data || []),
      error: () => this.stores.set([])
    });
  }

  private loadServiceTypes() {
    this.serviceTypesService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.serviceTypes.set(data || []),
      error: () => this.serviceTypes.set([])
    });
  }

  private setupSearchListener() {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((query) => {
        this.searchQuery.set(query);
      });
  }

  onSearchChange(query: string) {
    this.searchSubject$.next(query);
  }

  onFilterChange(filter: string) {
    this.filterStatus.set(filter);
  }

  onSortChange(sort: string) {
    this.sortBy.set(sort);
  }

  onNew() {
    this.router.navigate(['/appointments/new']);
  }

  onEdit(appointment: Appointments) {
    this.router.navigate([`/appointments/${appointment.id}/edit`]);
  }

  onView(appointment: Appointments) {
    this.router.navigate([`/appointments/${appointment.id}`]);
  }

  onDelete(appointment: Appointments) {
    if (confirm(`¿Estás seguro de que deseas eliminar la cita de "${appointment.customer}" del ${appointment.date}?`)) {
      this.appointmentsService
        .delete(appointment.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.appointments.set(this.appointments().filter(a => a.id !== appointment.id));
          },
          error: (err) => {
            console.error('Error deleting appointment:', err);
            this.error.set('Error deleting appointment. Please try again.');
          }
        });
    }
  }

  retryLoad() {
    this.loadAppointments();
  }

  getStatusBadge(appointment: Appointments): string {
    if (appointment.canceled) return 'Canceled';
    if (appointment.cloused) return 'Closed';
    return 'Active';
  }

  getStatusClass(appointment: Appointments): string {
    if (appointment.canceled) return 'canceled';
    if (appointment.cloused) return 'closed';
    return 'active';
  }

  getServiceTypeName(appointment: Appointments): string {
    const id = this.getServiceTypeId(appointment);
    if (!id) return 'N/A';
    return this.serviceTypes().find(t => t.id === id)?.name || 'N/A';
  }

  getCenterName(appointment: Appointments): string {
    const id = this.getCenterId(appointment);
    if (!id) return 'N/A';
    return this.centers().find(c => c.id === id)?.centerName || 'N/A';
  }

  getStoreName(appointment: Appointments): string {
    const id = this.getStoreId(appointment);
    if (!id) return 'N/A';
    return this.stores().find(s => s.id === id)?.storeName || 'N/A';
  }

  private getServiceTypeId(appointment: Appointments): number | null {
    return Number((appointment as any).serviceTypeId ?? (appointment as any).serviceType?.id ?? null) || null;
  }

  private getCenterId(appointment: Appointments): number | null {
    return Number((appointment as any).centerId ?? (appointment as any).centerid ?? (appointment as any).center?.id ?? null) || null;
  }

  private getStoreId(appointment: Appointments): number | null {
    return Number((appointment as any).storeId ?? (appointment as any).storeid ?? (appointment as any).store?.id ?? null) || null;
  }
}
