import { Component, signal, computed, effect, OnInit, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { Employees } from '../../shared/models/Employees';
import { EmployeesService } from '../../shared/services/employees.service';

interface EmployeeListState {
  items: Employees[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedFilters: {
    employeeType?: string;
    isCenterAdmin?: boolean;
  };
}

@Component({
  selector: 'app-employees-list-modern',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees-list-modern.component.html',
  styleUrls: ['./employees-list-modern.component.scss'],
  animations: [
    trigger('cardEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listStagger', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ]
})
export class EmployeesListModernComponent implements OnInit {
  // ============================================
  // 🔧 SIGNALS - Estado Reactivo
  // ============================================
  
  // Input Signals
  employeeTypeFilter = input<string | undefined>();
  centerAdminFilter = input<boolean | undefined>();

  // Output Signals (Event Emitters modernos)
  selectEmployee = output<Employees>();
  editEmployee = output<Employees>();
  deleteEmployee = output<Employees>();
  createNew = output<void>();

  // State Signals
  readonly state = signal<EmployeeListState>({
    items: [],
    loading: false,
    error: null,
    searchQuery: '',
    selectedFilters: {}
  });

  // Public Signals derivadas
  items = computed(() => this.state().items);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);
  searchQuery = computed(() => this.state().searchQuery);

  // ============================================
  // 💅 COMPUTED - Datos filtrados y transformados
  // ============================================
  
  filteredItems = computed(() => {
    const items = this.items();
    const query = this.searchQuery().toLowerCase();
    const filters = this.state().selectedFilters;

    return items.filter(emp => {
      // Búsqueda por nombre, email, código
      const matchesSearch =
        emp.firstName.toLowerCase().includes(query) ||
        emp.lastName.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.employeeCode.toLowerCase().includes(query);

      // Filtro por tipo
      const matchesType = !filters.employeeType || emp.employee_type === filters.employeeType;

      // Filtro por Centro Admin
      const matchesCenterAdmin = filters.isCenterAdmin === undefined || emp.isCenterAdmin === filters.isCenterAdmin;

      return matchesSearch && matchesType && matchesCenterAdmin;
    });
  });

  // Estadísticas
  stats = computed(() => ({
    total: this.items().length,
    filtered: this.filteredItems().length,
    experts: this.items().filter(e => e.employee_type === 'Expert').length,
    accountants: this.items().filter(e => e.employee_type === 'Accountant').length,
    admins: this.items().filter(e => e.employee_type === 'AdminStore').length,
    centerAdmins: this.items().filter(e => e.isCenterAdmin).length,
  }));

  // Mostrar estado vacío
  isEmpty = computed(() => this.filteredItems().length === 0 && !this.loading());
  hasError = computed(() => this.error() !== null);

  constructor(
    private employeesService: EmployeesService,
    private router: Router
  ) {
    // ============================================
    // 🔄 EFFECT - Auto-recargar cuando cambian filtros
    // ============================================
    effect(() => {
      const empType = this.employeeTypeFilter();
      const centerAdmin = this.centerAdminFilter();
      
      this.state.update(s => ({
        ...s,
        selectedFilters: {
          employeeType: empType,
          isCenterAdmin: centerAdmin
        }
      }));
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  // ============================================
  // 📥 MÉTODOS DE CARGA
  // ============================================

  private loadEmployees(): void {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    
    this.employeesService.getAll().subscribe({
      next: (items) => {
        this.state.update(s => ({
          ...s,
          items,
          loading: false
        }));
      },
      error: (err) => {
        this.state.update(s => ({
          ...s,
          error: 'Error cargando empleados',
          loading: false
        }));
      }
    });
  }

  // ============================================
  // 🔍 BÚSQUEDA Y FILTRADO
  // ============================================

  updateSearch(query: string): void {
    this.state.update(s => ({ ...s, searchQuery: query }));
  }

  clearSearch(): void {
    this.state.update(s => ({ ...s, searchQuery: '' }));
  }

  filterByType(type: string | null): void {
    this.state.update(s => ({
      ...s,
      selectedFilters: { ...s.selectedFilters, employeeType: type || undefined }
    }));
  }

  onFilterByEmployeeType($event: Event): void {
    const value = ($event.target as HTMLSelectElement)?.value;
    this.filterByType(value || null);
  }

  onFilterByCenterAdmin($event: Event): void {
    const value = ($event.target as HTMLSelectElement)?.value;
    const boolValue = value ? (value === 'true' ? true : false) : null;
    this.filterByCenterAdmin(boolValue);
  }

  parseCenterAdminValue(value: string): boolean | null {
    return value ? (value === 'true') : null;
  }

  filterByCenterAdmin(value: boolean | null): void {
    this.state.update(s => ({
      ...s,
      selectedFilters: { ...s.selectedFilters, isCenterAdmin: value === null ? undefined : value }
    }));
  }

  resetFilters(): void {
    this.state.update(s => ({
      ...s,
      searchQuery: '',
      selectedFilters: {}
    }));
  }

  // ============================================
  // 🎬 ACCIONES
  // ============================================

  onSelect(employee: Employees): void {
    this.selectEmployee.emit(employee);
    this.router.navigate(['/employees', employee.id]);
  }

  onEdit(employee: Employees, $event: Event): void {
    $event.stopPropagation();
    this.editEmployee.emit(employee);
    this.router.navigate(['/employees', employee.id, 'edit']);
  }

  onDelete(employee: Employees, $event: Event): void {
    $event.stopPropagation();
    
    if (confirm(`¿Eliminar ${employee.firstName} ${employee.lastName}?`)) {
      this.employeesService.delete(employee.id).subscribe({
        next: () => {
          this.state.update(s => ({
            ...s,
            items: s.items.filter(e => e.id !== employee.id)
          }));
        },
        error: () => {
          this.state.update(s => ({ ...s, error: 'Error al eliminar empleado' }));
        }
      });
    }
  }

  onCreateNew(): void {
    this.createNew.emit();
    this.router.navigate(['/employees', 'new']);
  }

  onRefresh(): void {
    this.loadEmployees();
  }

  // ============================================
  // 🛠️ HELPERS
  // ============================================

  getFullName(employee: Employees): string {
    return `${employee.firstName} ${employee.lastName}`;
  }

  getEmployeeTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'Expert': 'Experto',
      'Accountant': 'Contador',
      'AdminStore': 'Admin Tienda'
    };
    return labels[type] || type;
  }

  getEmployeeTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'Expert': 'primary',
      'Accountant': 'info',
      'AdminStore': 'warning'
    };
    return colors[type] || 'secondary';
  }
}
