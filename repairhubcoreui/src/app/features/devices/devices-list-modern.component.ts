import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Devices } from '../../shared/models/Devices';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { DevicesService } from '../../shared/services/devices.service';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';

interface ListState {
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-devices-list-modern',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devices-list-modern.component.html',
  styleUrl: './devices-list-modern.component.scss',
})
export class DevicesListModernComponent implements OnInit {
  private devicesService = inject(DevicesService);
  private centersService = inject(CentersService);
  private storesService = inject(StoresService);
  private router = inject(Router);

  readonly listState = signal<ListState>({ isLoading: false, error: null });
  readonly devices = signal<Devices[]>([]);
  readonly centers = signal<Centers[]>([]);
  readonly stores = signal<Stores[]>([]);

  readonly searchQuery = signal('');
  readonly filterCenter = signal<number | 0>(0);
  readonly filterStore = signal<number | 0>(0);
  readonly sortBy = signal<'id' | 'name' | 'date'>('name');

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  readonly filteredDevices = computed(() => {
    const allDevices = this.devices();
    const query = this.searchQuery().toLowerCase();
    const center = this.filterCenter();
    const store = this.filterStore();
    const sort = this.sortBy();

    let filtered = allDevices.filter(device => {
      const matchesSearch = !query ||
        device.name.toLowerCase().includes(query) ||
        device.description?.toLowerCase().includes(query);

      const matchesCenter = center === 0 || device.centerId === center;
      const matchesStore = store === 0 || device.storeId === store;

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

  readonly isEmptyState = computed(() => this.filteredDevices().length === 0 && !this.listState().isLoading);

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
      this.loadDevices(),
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

  private loadDevices() {
    return this.devicesService.getAll().toPromise().then(data => {
      this.devices.set(data || []);
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

  getCenterName(device: Devices): string {
    const center = this.centers().find(c => c.id === device.centerId);
    return center?.centerName || 'N/A';
  }

  getStoreName(device: Devices): string {
    const store = this.stores().find(s => s.id === device.storeId);
    return store?.storeName || 'N/A';
  }

  editDevice(device: Devices) {
    this.router.navigate(['/devices', device.id, 'edit']);
  }

  viewDevice(device: Devices) {
    this.router.navigate(['/devices', device.id]);
  }

  deleteDevice(device: Devices) {
    if (confirm(`¿Eliminar dispositivo "${device.name}"?`)) {
      this.devicesService.delete(device.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.devices.update(devices => devices.filter(d => d.id !== device.id));
        },
        error: (err) => {
          alert(`Error al eliminar: ${err.message}`);
        }
      });
    }
  }

  createNew() {
    this.router.navigate(['/devices', 'new']);
  }

  retryLoad() {
    this.loadAllData();
  }
}
