import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { SaleItems } from '../../shared/models/SaleItems';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { Items } from '../../shared/models/Items';
import { Sales } from '../../shared/models/Sales';
import { SaleItemsService } from '../../shared/services/sale-items.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { ItemsService } from '../../shared/services/items.service';
import { SalesService } from '../../shared/services/sales.service';

interface ListState {
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-sale-items-list-modern',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sale-items-list-modern.component.html',
  styleUrl: './sale-items-list-modern.component.scss',
})
export class SaleItemsListModernComponent implements OnInit {
  private saleItemsService = inject(SaleItemsService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private itemsService = inject(ItemsService);
  private salesService = inject(SalesService);
  private router = inject(Router);

  readonly listState = signal<ListState>({ isLoading: false, error: null });
  readonly saleItems = signal<SaleItems[]>([]);
  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);
  readonly items = signal<Items[]>([]);
  readonly sales = signal<Sales[]>([]);
  
  readonly searchQuery = signal('');
  readonly filterCenter = signal<number | 0>(0);
  readonly filterStore = signal<number | 0>(0);
  readonly sortBy = signal<'id' | 'quantity' | 'price' | 'date'>('date');

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  readonly filteredSaleItems = computed(() => {
    const allItems = this.saleItems();
    const query = this.searchQuery().toLowerCase();
    const center = this.filterCenter();
    const store = this.filterStore();
    const sort = this.sortBy();

    let filtered = allItems.filter(saleItem => {
      const matchesSearch = !query || 
        saleItem.id.toString().includes(query) ||
        this.getItemName(saleItem).toLowerCase().includes(query) ||
        this.getSaleId(saleItem).includes(query);

      const matchesCenter = center === 0 || saleItem.center?.id === center;
      const matchesStore = store === 0 || saleItem.store?.id === store;

      return matchesSearch && matchesCenter && matchesStore;
    });

    if (sort === 'id') {
      filtered.sort((a, b) => b.id - a.id);
    } else if (sort === 'quantity') {
      filtered.sort((a, b) => b.quantity - a.quantity);
    } else if (sort === 'price') {
      filtered.sort((a, b) => b.price - a.price);
    } else {
      filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return filtered;
  });

  readonly isEmptyState = computed(() => this.filteredSaleItems().length === 0 && !this.listState().isLoading);

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
      this.loadSaleItems(),
      this.loadCenters(),
      this.loadStores(),
      this.loadItems(),
      this.loadSales(),
    ])
      .catch(error => {
        this.listState.update(s => ({ ...s, error: error.message }));
      })
      .finally(() => {
        this.listState.update(s => ({ ...s, isLoading: false }));
      });
  }

  private loadSaleItems() {
    return this.saleItemsService.getAll().toPromise().then(data => {
      this.saleItems.set(data || []);
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

  private loadItems() {
    return this.itemsService.getAll().toPromise().then(data => {
      this.items.set(data || []);
    });
  }

  private loadSales() {
    return this.salesService.getAll().toPromise().then(data => {
      this.sales.set(data || []);
    });
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  onFilterCenterChange(value: string) {
    this.filterCenter.set(Number(value));
  }

  onFilterStoreChange(value: string) {
    this.filterStore.set(Number(value));
  }

  onSortChange(field: string) {
    this.sortBy.set(field as 'id' | 'quantity' | 'price' | 'date');
  }

  getCenterName(saleItem: SaleItems): string {
    return saleItem.center?.centerName || 'N/A';
  }

  getStoreName(saleItem: SaleItems): string {
    return saleItem.store?.storeName || 'N/A';
  }

  getItemName(saleItem: SaleItems): string {
    return saleItem.item?.product || 'N/A';
  }

  getSaleId(saleItem: SaleItems): string {
    return saleItem.sale?.id.toString() || 'N/A';
  }

  getTotalPrice(saleItem: SaleItems): number {
    return (saleItem.price * saleItem.quantity) - saleItem.discount;
  }

  getTotalCost(saleItem: SaleItems): number {
    return saleItem.cost * saleItem.quantity;
  }

  getProfit(saleItem: SaleItems): number {
    return this.getTotalPrice(saleItem) - this.getTotalCost(saleItem);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  editSaleItem(saleItem: SaleItems) {
    this.router.navigate(['/sale-items', saleItem.id, 'edit']);
  }

  viewSaleItem(saleItem: SaleItems) {
    this.router.navigate(['/sale-items', saleItem.id]);
  }

  deleteSaleItem(saleItem: SaleItems) {
    if (confirm(`Are you sure you want to delete sale item #${saleItem.id}?`)) {
      this.saleItemsService.delete(saleItem.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.saleItems.update(items => items.filter(item => item.id !== saleItem.id));
        },
        error: (err) => {
          alert(`Error deleting: ${err.message}`);
        }
      });
    }
  }

  createNew() {
    this.router.navigate(['/sale-items', 'new']);
  }

  retryLoad() {
    this.loadAllData();
  }
}
