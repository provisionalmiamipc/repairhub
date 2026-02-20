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
import { Stores } from '../../shared/models/Stores';
import { StoresService } from '../../shared/services/stores.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-stores-list-modern',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stores-list-modern.component.html',
  styleUrl: './stores-list-modern.component.scss',
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
export class StoresListModernComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private storesService = inject(StoresService);

  // Signals State Management
  stores = signal<Stores[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  filterState = signal('all');
  sortBy = signal('name');

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Computed derived state
  filteredStores = computed(() => {
    const items = this.stores();
    const query = this.searchQuery().toLowerCase();
    const state = this.filterState();

    let filtered = items.filter(item => {
      const matchesSearch =
        item.storeName.toLowerCase().includes(query) ||
        item.storeCode.toLowerCase().includes(query) ||
        item.city.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query);

      const matchesState = state === 'all' || item.id.toString().includes(state);

      return matchesSearch && matchesState;
    });

    // Apply sorting
    const sortKey = this.sortBy();
    if (sortKey === 'name') {
      filtered.sort((a, b) => a.storeName.localeCompare(b.storeName));
    } else if (sortKey === 'code') {
      filtered.sort((a, b) => a.storeCode.localeCompare(b.storeCode));
    } else if (sortKey === 'city') {
      filtered.sort((a, b) => a.city.localeCompare(b.city));
    }

    return filtered;
  });

  isEmptyState = computed(() => this.filteredStores().length === 0 && !this.isLoading());

  ngOnInit() {
    this.loadStores();
    this.setupSearchListener();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStores() {
    this.isLoading.set(true);
    this.error.set(null);

    this.storesService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stores.set(data || []);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading stores:', err);
          this.error.set('Error loading stores. Please try again.');
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
    this.filterState.set(filter);
  }

  onSortChange(sort: string) {
    this.sortBy.set(sort);
  }

  onNew() {
    this.router.navigate(['/stores/new']);
  }

  onEdit(store: Stores) {
    this.router.navigate([`/stores/${store.id}/edit`]);
  }

  onView(store: Stores) {
    this.router.navigate([`/stores/${store.id}`]);
  }

  onDelete(store: Stores) {
    if (confirm(`Are you sure you want to delete the store "${store.storeName}"?`)) {
      this.storesService
        .delete(store.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.stores.set(this.stores().filter(s => s.id !== store.id));
          },
          error: (err) => {
            console.error('Error deleting store:', err);
            this.error.set('Error deleting store. Please try again.');
          }
        });
    }
  }

  retryLoad() {
    this.loadStores();
  }
}
