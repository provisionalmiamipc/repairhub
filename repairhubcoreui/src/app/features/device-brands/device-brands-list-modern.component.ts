import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { DeviceBrands } from '../../shared/models/DeviceBrands';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { DeviceBrandsService } from '../../shared/services/device-brands.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';

interface ListState {
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-device-brands-list-modern',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './device-brands-list-modern.component.html',
  styleUrl: './device-brands-list-modern.component.scss',
})
export class DeviceBrandsListModernComponent implements OnInit {
  private deviceBrandsService = inject(DeviceBrandsService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private router = inject(Router);

  readonly listState = signal<ListState>({ isLoading: false, error: null });
  readonly deviceBrands = signal<DeviceBrands[]>([]);
  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);
  
  readonly searchQuery = signal('');
  readonly filterCenter = signal<number | 0>(0);
  readonly filterStore = signal<number | 0>(0);
  readonly sortBy = signal<'id' | 'name' | 'date'>('name');

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  readonly filteredDeviceBrands = computed(() => {
    const allBrands = this.deviceBrands();
    const query = this.searchQuery().toLowerCase();
    const center = this.filterCenter();
    const store = this.filterStore();
    const sort = this.sortBy();

    let filtered = allBrands.filter(brand => {
      const matchesSearch = !query || 
        brand.name.toLowerCase().includes(query) ||
        brand.description?.toLowerCase().includes(query);

      const matchesCenter = center === 0 || brand.centerId === center;
      const matchesStore = store === 0 || brand.storeId === store;

      return matchesSearch && matchesCenter && matchesStore;
    });

    if (sort === 'id') {
      filtered.sort((a, b) => b.id - a.id);
    } else if (sort === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  });

  readonly isEmptyState = computed(() => this.filteredDeviceBrands().length === 0 && !this.listState().isLoading);

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
      this.loadDeviceBrands(),
      this.loadCenters(),
      this.loadStores(),
    ])
      .catch(error => {
        this.listState.update(s => ({ ...s, error: error.message }));
      })
      .finally(() => {
        this.listState.update(s => ({ ...s, isLoading: false }));
      });
  }

  private loadDeviceBrands() {
    return this.deviceBrandsService.getAll().toPromise().then(data => {
      this.deviceBrands.set(data || []);
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
    this.sortBy.set(field as 'id' | 'name' | 'date');
  }

  getCenterName(brand: DeviceBrands): string {
    const center = this.centers().find(c => c.id === brand.centerId);
    return center?.centerName || 'N/A';
  }

  getStoreName(brand: DeviceBrands): string {
    const store = this.stores().find(s => s.id === brand.storeId);
    return store?.storeName || 'N/A';
  }

  editDeviceBrand(brand: DeviceBrands) {
    this.router.navigate(['/device-brands', brand.id, 'edit']);
  }

  viewDeviceBrand(brand: DeviceBrands) {
    this.router.navigate(['/device-brands', brand.id]);
  }

  deleteDeviceBrand(brand: DeviceBrands) {
    if (confirm(`Are you sure you want to delete brand "${brand.name}"?`)) {
      this.deviceBrandsService.delete(brand.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.deviceBrands.update(brands => brands.filter(b => b.id !== brand.id));
        },
        error: (err) => {
          alert(`Error deleting: ${err.message}`);
        }
      });
    }
  }

  createNew() {
    this.router.navigate(['/device-brands', 'new']);
  }

  retryLoad() {
    this.loadAllData();
  }
}
