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
import { Customers } from '../../shared/models/Customers';
import { CustomersService } from '../../shared/services/customers.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-customers-list-modern',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers-list-modern.component.html',
  styleUrl: './customers-list-modern.component.scss',
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
export class CustomersListModernComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private customersService = inject(CustomersService);

  // Signals State Management
  customers = signal<Customers[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  filterType = signal('all');
  sortBy = signal('name');

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Computed derived state
  filteredCustomers = computed(() => {
    const items = this.customers();
    const query = this.searchQuery().toLowerCase();
    const type = this.filterType();

    let filtered = items.filter(item => {
      const matchesSearch =
        item.firstName.toLowerCase().includes(query) ||
        item.lastName.toLowerCase().includes(query) ||
        item.customerCode.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.phone.toLowerCase().includes(query) ||
        item.city.toLowerCase().includes(query);

      const matchesType = type === 'all' ||
        (type === 'b2b' && item.b2b) ||
        (type === 'b2c' && !item.b2b);

      return matchesSearch && matchesType;
    });

    // Apply sorting
    const sortKey = this.sortBy();
    if (sortKey === 'name') {
      filtered.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    } else if (sortKey === 'code') {
      filtered.sort((a, b) => a.customerCode.localeCompare(b.customerCode));
    } else if (sortKey === 'city') {
      filtered.sort((a, b) => a.city.localeCompare(b.city));
    }

    return filtered;
  });

  isEmptyState = computed(() => this.filteredCustomers().length === 0 && !this.isLoading());

  ngOnInit() {
    this.loadCustomers();
    this.setupSearchListener();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCustomers() {
    this.isLoading.set(true);
    this.error.set(null);

    this.customersService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.customers.set(data || []);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading customers:', err);
          this.error.set('Error loading customers. Try again.');
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
    this.filterType.set(filter);
  }

  onSortChange(sort: string) {
    this.sortBy.set(sort);
  }

  onNew() {
    this.router.navigate(['/customers/new']);
  }

  onEdit(customer: Customers) {
    this.router.navigate([`/customers/${customer.id}/edit`]);
  }

  onView(customer: Customers) {
    this.router.navigate([`/customers/${customer.id}`]);
  }

  onDelete(customer: Customers) {
    const fullName = `${customer.firstName} ${customer.lastName}`;
    if (confirm(`Are you sure you want to delete customer "${fullName}"?`)) {
      this.customersService
        .delete(customer.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.customers.set(this.customers().filter(c => c.id !== customer.id));
          },
          error: (err) => {
            console.error('Error deleting customer:', err);
            this.error.set('Error deleting customer. Try again.');
          }
        });
    }
  }

  retryLoad() {
    this.loadCustomers();
  }
}
