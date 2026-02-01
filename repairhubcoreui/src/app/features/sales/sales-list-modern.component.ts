import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Sales } from '../../shared/models/Sales';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { Customers } from '../../shared/models/Customers';
import { SalesService } from '../../shared/services/sales.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { CustomersService } from '../../shared/services/customers.service';

interface ListState {
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-sales-list-modern',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-list-modern.component.html',
  styleUrl: './sales-list-modern.component.scss',
})
export class SalesListModernComponent implements OnInit {
  private salesService = inject(SalesService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private customersService = inject(CustomersService);
  private router = inject(Router);

  readonly listState = signal<ListState>({ isLoading: false, error: null });
  readonly sales = signal<Sales[]>([]);
  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);
  readonly customers = signal<Customers[]>([]);
  
  readonly searchQuery = signal('');
  readonly filterStatus = signal<'all' | 'active' | 'closed' | 'canceled'>('all');
  readonly sortBy = signal<'id' | 'totalPrice' | 'date'>('date');

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  readonly filteredSales = computed(() => {
    const allSales = this.sales();
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    const sort = this.sortBy();

    let filtered = allSales.filter(sale => {
      const matchesSearch = !query || 
        sale.id.toString().includes(query) ||
        this.getCustomerName(sale).toLowerCase().includes(query);

      const matchesStatus = status === 'all' || 
        (status === 'active' && !sale.cloused && !sale.canceled) ||
        (status === 'closed' && sale.cloused) ||
        (status === 'canceled' && sale.canceled);

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

  readonly isEmptyState = computed(() => this.filteredSales().length === 0 && !this.listState().isLoading);

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
      this.loadSales(),
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

  private loadSales() {
    return this.salesService.getAll().toPromise().then(data => {
      this.sales.set(data || []);
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

  getCustomerName(sale: Sales): string {
    if (sale.customer) {
      return `${sale.customer.firstName || ''} ${sale.customer.lastName || ''}`.trim();
    }
    return 'N/A';
  }

  getCenterName(sale: Sales): string {
    return sale.center?.centerName || 'N/A';
  }

  getStoreName(sale: Sales): string {
    return sale.store?.storeName || 'N/A';
  }

  getPaymentTypeName(sale: Sales): string {
    return sale.paymentType?.type || 'N/A';
  }

  getSaleStatus(sale: Sales): 'active' | 'closed' | 'canceled' {
    if (sale.canceled) return 'canceled';
    if (sale.cloused) return 'closed';
    return 'active';
  }

  getTotalCost(sale: Sales): number {
    return parseFloat(sale.totalCost) || 0;
  }

  getProfit(sale: Sales): number {
    return sale.totalPrice - this.getTotalCost(sale);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  editSale(sale: Sales) {
    this.router.navigate(['/sales', sale.id, 'edit']);
  }

  viewSale(sale: Sales) {
    this.router.navigate(['/sales', sale.id]);
  }

  deleteSale(sale: Sales) {
    if (confirm(`¿Eliminar venta #${sale.id}?`)) {
      this.salesService.delete(sale.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.sales.update(sales => sales.filter(s => s.id !== sale.id));
        },
        error: (err) => {
          alert(`Error al eliminar: ${err.message}`);
        }
      });
    }
  }

  createNew() {
    this.router.navigate(['/sales', 'new']);
  }

  retryLoad() {
    this.loadAllData();
  }
}
