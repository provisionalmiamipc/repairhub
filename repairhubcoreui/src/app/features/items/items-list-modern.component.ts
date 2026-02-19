import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { Items } from '../../shared/models/Items';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { ItemTypes } from '../../shared/models/ItemTypes';
import { ItemsService } from '../../shared/services/items.service';
import { AuthService } from '../../shared/services/auth.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { ItemTypesService } from '../../shared/services/item-types.service';

interface ListState {
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-items-list-modern',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './items-list-modern.component.html',
  styleUrl: './items-list-modern.component.scss',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ItemsListModernComponent implements OnInit {
  private itemsService = inject(ItemsService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private itemTypesService = inject(ItemTypesService);
  private router = inject(Router);
  public authService = inject(AuthService);

  // State Signals
  readonly listState = signal<ListState>({ isLoading: false, error: null });
  readonly items = signal<Items[]>([]);
  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);
  readonly itemTypes = signal<ItemTypes[]>([]);
  
  readonly searchQuery = signal('');
  readonly filterStatus = signal<'all' | 'active' | 'inactive'>('all');
  readonly filterCenter = signal<number | 0>(0);
  readonly filterStore = signal<number | 0>(0);
  readonly filterType = signal<number | 0>(0);
  readonly sortBy = signal<'product' | 'sku' | 'price' | 'stock' | 'date'>('date');
  // viewMode: 'professional' = table/list view, 'cards' = card/grid view
  readonly viewMode = signal<'professional' | 'cards'>('professional');

  // Search debouncer
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Computed properties
  readonly filteredItems = computed(() => {
    const allItems = this.items();
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    const centerId = this.filterCenter();
    const storeId = this.filterStore();
    const typeId = this.filterType();
    const sort = this.sortBy();

    let filtered = allItems.filter(item => {
      // Search filter
      const matchesSearch = !query || 
        item.product.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.barcode?.toLowerCase().includes(query);

      // Status filter
      const matchesStatus = status === 'all' || 
        (status === 'active' && item.isActive) ||
        (status === 'inactive' && !item.isActive);

      // Center filter
      const itemCenterId = this.getItemCenterId(item);
      const itemStoreId = this.getItemStoreId(item);

      const matchesCenter = !centerId || itemCenterId === centerId;

      // Store filter
      const matchesStore = !storeId || itemStoreId === storeId;

      // Type filter
      const matchesType = !typeId || item.itemTypeId === typeId;

      return matchesSearch && matchesStatus && matchesCenter && matchesStore && matchesType;
    });

    // Sort
    if (sort === 'product') {
      filtered.sort((a, b) => a.product.localeCompare(b.product));
    } else if (sort === 'sku') {
      filtered.sort((a, b) => a.sku.localeCompare(b.sku));
    } else if (sort === 'price') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === 'stock') {
      filtered.sort((a, b) => b.stock - a.stock);
    } else {
      filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return filtered;
  });

  readonly isEmptyState = computed(() => this.filteredItems().length === 0 && !this.listState().isLoading);

  ngOnInit() {
    this.loadAllData();
    
    // Setup search debouncer
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
      this.loadItems(),
      this.loadCenters(),
      this.loadStores(),
      this.loadItemTypes(),
    ])
      .catch(error => {
        this.listState.update(s => ({ ...s, error: error.message }));
      })
      .finally(() => {
        this.listState.update(s => ({ ...s, isLoading: false }));
      });
  }

  private loadItems() {
    return this.itemsService.getAll().toPromise().then(data => {
      this.items.set(data || []);
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

  private loadItemTypes() {
    return this.itemTypesService.getAll().toPromise().then(data => {
      this.itemTypes.set(data || []);
    });
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  setView(mode: 'professional' | 'cards') {
    this.viewMode.set(mode);
  }

  onFilterChange(field: 'status' | 'center' | 'store' | 'type', value: string) {
    const numValue = value ? Number(value) : 0;
    
    if (field === 'status') {
      this.filterStatus.set(value as 'all' | 'active' | 'inactive');
    } else if (field === 'center') {
      this.filterCenter.set(numValue);
      this.filterStore.set(0); // Reset store when center changes
    } else if (field === 'store') {
      this.filterStore.set(numValue);
    } else if (field === 'type') {
      this.filterType.set(numValue);
    }
  }

  onSortChange(field: string) {
    this.sortBy.set(field as 'product' | 'sku' | 'price' | 'stock' | 'date');
  }

  getCenterName(centerId: number | null | undefined): string {
    if (!centerId) return 'N/A';
    return this.centers().find(c => c.id === centerId)?.centerName || 'N/A';
  }

  getStoreName(storeId: number | null | undefined): string {
    if (!storeId) return 'N/A';
    return this.stores().find(s => s.id === storeId)?.storeName || 'N/A';
  }

  getItemCenterId(item: Items): number | null {
    return Number((item as any).centerId ?? (item as any).centerid ?? (item as any).center?.id ?? null) || null;
  }

  getItemStoreId(item: Items): number | null {
    return Number((item as any).storeId ?? (item as any).storeid ?? (item as any).store?.id ?? null) || null;
  }

  getTypeName(typeId: number): string {
    return this.itemTypes().find(t => t.id === typeId)?.name || 'N/A';
  }

  getStockStatus(item: Items): 'critical' | 'low' | 'normal' {
    if (item.stock <= 0) return 'critical';
    if (item.stock <= item.minimunStock) return 'low';
    return 'normal';
  }

  getPriceMargin(item: Items): number {
    if (item.cost === 0) return 0;
    return ((item.price - item.cost) / item.cost) * 100;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  editItem(item: Items) {
    this.router.navigate(['/items', item.id, 'edit']);
  }

  viewItem(item: Items) {
    this.router.navigate(['/items', item.id]);
  }

  deleteItem(item: Items) {
    if (confirm(`Delete item "${item.product}"?`)) {
      this.itemsService.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.items.update(items => items.filter(i => i.id !== item.id));
        },
        error: (err) => {
          alert(`Error deleting: ${err.message}`);
        }
      });
    }
  }

  createNew() {
    this.router.navigate(['/items', 'new']);
  }

  retryLoad() {
    this.loadAllData();
  }
}
