import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { Centers } from '../../shared/models/Centers';
import { CentersService } from '../../shared/services/centers.service';
import { AuthService } from '../../shared/services/auth.service';

interface CenterListState {
  items: Centers[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
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
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class CentersListModernComponent implements OnInit {
  // ============================================
  // 🔧 STATE SIGNALS
  // ============================================
  
  readonly state = signal<CenterListState>({
    items: [],
    loading: false,
    error: null,
    searchQuery: ''
  });

  // ============================================
  // 💅 COMPUTED - Propiedades derivadas
  // ============================================
  
  items = computed(() => this.state().items);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);
  searchQuery = computed(() => this.state().searchQuery);

  filteredItems = computed(() => {
    const items = this.items();
    const query = this.searchQuery().toLowerCase();

    return items.filter(center => 
      center.centerName.toLowerCase().includes(query) ||
      center.centerCode.toLowerCase().includes(query) ||
      center.city.toLowerCase().includes(query) ||
      center.email.toLowerCase().includes(query)
    );
  });

  stats = computed(() => ({
    total: this.items().length,
    filtered: this.filteredItems().length
  }));

  hasResults = computed(() => this.filteredItems().length > 0);
  isEmpty = computed(() => this.items().length === 0 && !this.loading());

  constructor(
    private centersService: CentersService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCenters();
  }

  // ============================================
  // 🔄 DATA LOADING
  // ============================================
  
  loadCenters(): void {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    this.centersService.getAll().subscribe({
      next: (data) => {
        this.state.update(s => ({ 
          ...s, 
          items: data,
          loading: false 
        }));
      },
      error: (err) => {
          this.state.update(s => ({ 
            ...s, 
            loading: false,
            error: err?.error?.message || 'Error loading centers'
          }));
        }
    });
  }

  // ============================================
  // 🔍 SEARCH & FILTER
  // ============================================
  
  updateSearch(query: string): void {
    this.state.update(s => ({ ...s, searchQuery: query }));
  }

  clearSearch(): void {
    this.state.update(s => ({ ...s, searchQuery: '' }));
  }

  // ============================================
  // ⚡ ACTIONS
  // ============================================
  
  onCreateNew(): void {
    this.router.navigate(['/centers', 'new']);
  }

  onEdit(center: Centers): void {
    this.router.navigate(['/centers', center.id, 'edit']);
  }

  onView(center: Centers): void {
    this.router.navigate(['/centers', center.id]);
  }

  onDelete(center: Centers): void {
    if (confirm(`Are you sure you want to delete "${center.centerName}"?`)) {
      this.centersService.delete(center.id).subscribe({
        next: () => {
          this.state.update(s => ({
            ...s,
            items: s.items.filter(c => c.id !== center.id)
          }));
        },
        error: (err) => {
          this.state.update(s => ({
            ...s,
            error: err?.error?.message || 'Error deleting'
          }));
        }
      });
    }
  }

  clearError(): void {
    this.state.update(s => ({ ...s, error: null }));
  }

  // ============================================
  // 🎨 UTILITY METHODS
  // ============================================
  
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getColorHash(id: number): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    return colors[id % colors.length];
  }
}
