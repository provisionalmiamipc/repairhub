// ============================================
// 🎯 EJEMPLO RÁPIDO: CENTERS CRUD MODERNO
// (Template listo para copiar y adaptar)
// ============================================

import { Component, signal, computed, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Centers } from '../../shared/models/Centers';
import { CentersService } from '../../shared/services/centers.service';

interface CenterListState {
  items: Centers[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedFilters: {
    isActive?: boolean;
  };
}

@Component({
  selector: 'app-centers-list-modern',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './centers-list-modern.component.html',
  styleUrls: ['./centers-list-modern.component.scss'],
  animations: [
    trigger('cardEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class CentersListModernComponent implements OnInit {
  // ============================================
  // 🔧 SIGNALS
  // ============================================
  
  private readonly state = signal<CenterListState>({
    items: [],
    loading: false,
    error: null,
    searchQuery: '',
    selectedFilters: {}
  });

  items = computed(() => this.state().items);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);
  searchQuery = computed(() => this.state().searchQuery);

  // ============================================
  // 💅 COMPUTED
  // ============================================
  
  filteredItems = computed(() => {
    const items = this.items();
    const query = this.searchQuery().toLowerCase();
    const filters = this.state().selectedFilters;

    return items.filter(center => {
      const matchesSearch =
        center.centerName.toLowerCase().includes(query) ||
        center.address?.toLowerCase().includes(query) ||
        center.phoneNumber?.toLowerCase().includes(query);

      const matchesActive = filters.isActive === undefined || 
        true;

      return matchesSearch && matchesActive;
    });
  });

  stats = computed(() => ({
    total: this.items().length,
    filtered: this.filteredItems().length,
    active: this.items().length,
    inactive: 0,
  }));

  isEmpty = computed(() => this.filteredItems().length === 0 && !this.loading());

  // ============================================
  // 📤 OUTPUTS
  // ============================================
  
  selectCenter = output<Centers>();
  editCenter = output<Centers>();
  deleteCenter = output<Centers>();
  createNew = output<void>();

  constructor(private centersService: CentersService) {}

  ngOnInit(): void {
    this.loadCenters();
  }

  // ============================================
  // 📥 MÉTODOS
  // ============================================

  private loadCenters(): void {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    
    this.centersService.getAll().subscribe({
      next: (items) => {
        this.state.update(s => ({ ...s, items, loading: false }));
      },
      error: (err) => {
        this.state.update(s => ({
          ...s,
          error: 'Error cargando centros',
          loading: false
        }));
      }
    });
  }

  updateSearch(query: string): void {
    this.state.update(s => ({ ...s, searchQuery: query }));
  }

  clearSearch(): void {
    this.state.update(s => ({ ...s, searchQuery: '' }));
  }

  filterByStatus(value: boolean | null): void {
    this.state.update(s => ({
      ...s,
      selectedFilters: { ...s.selectedFilters, isActive: value === null ? undefined : value }
    }));
  }

  resetFilters(): void {
    this.state.update(s => ({
      ...s,
      searchQuery: '',
      selectedFilters: {}
    }));
  }

  onSelect(center: Centers): void {
    this.selectCenter.emit(center);
  }

  onEdit(center: Centers, $event: Event): void {
    $event.stopPropagation();
    this.editCenter.emit(center);
  }

  onDelete(center: Centers, $event: Event): void {
    $event.stopPropagation();
    
    if (confirm(`¿Eliminar ${center.centerName}?`)) {
      this.centersService.delete(center.id).subscribe({
        next: () => {
          this.state.update(s => ({
            ...s,
            items: s.items.filter(c => c.id !== center.id)
          }));
        },
        error: () => {
          this.state.update(s => ({ 
            ...s, 
            error: 'Error al eliminar centro' 
          }));
        }
      });
    }
  }

  onRefresh(): void {
    this.loadCenters();
  }

  onCreateNew(): void {
    this.createNew.emit();
  }

  // ============================================
  // 🛠️ HELPERS
  // ============================================

  getStoreCount(center: Centers): number {
    return center.stores?.length || 0;
  }

  getEmployeeCount(center: Centers): number {
    return center.employees?.length || 0;
  }
}
