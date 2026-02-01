import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { ServiceTypes } from '../../shared/models/ServiceTypes';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-types-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-types-list.component.html',
  styleUrls: ['./service-types-list.component.scss']
})
export class ServiceTypesListComponent {
  @Input() set serviceTypes(value: ServiceTypes[]) {
    this.serviceTypesList.set(value);
  }

  @Output() select = new EventEmitter<ServiceTypes>();
  @Output() edit = new EventEmitter<ServiceTypes>();
  @Output() delete = new EventEmitter<ServiceTypes>();
  @Output() new = new EventEmitter<void>();

  private serviceTypesList = signal<ServiceTypes[]>([]);
  private searchTerm = signal<string>('');

  filteredServiceTypes = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.serviceTypesList().filter(st =>
      st.name.toLowerCase().includes(term)
    );
  });

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  onNew(): void {
    this.new.emit();
  }
}
