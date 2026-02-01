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
import { AppointmentsService } from '../../shared/services/appointments.service';
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

  // Signals State Management
  appointments = signal<Appointments[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  filterStatus = signal('all');
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

  isEmptyState = computed(() => this.filteredAppointments().length === 0 && !this.isLoading());

  ngOnInit() {
    this.loadAppointments();
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
          this.appointments.set(data || []);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading appointments:', err);
          this.error.set('Error al cargar las citas. Intenta de nuevo.');
          this.isLoading.set(false);
        }
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
            this.error.set('Error al eliminar la cita. Intenta de nuevo.');
          }
        });
    }
  }

  retryLoad() {
    this.loadAppointments();
  }

  getStatusBadge(appointment: Appointments): string {
    if (appointment.canceled) return 'Cancelada';
    if (appointment.cloused) return 'Cerrada';
    return 'Activa';
  }

  getStatusClass(appointment: Appointments): string {
    if (appointment.canceled) return 'canceled';
    if (appointment.cloused) return 'closed';
    return 'active';
  }
}
