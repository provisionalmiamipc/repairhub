import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '../../shared/services/customers.service';

@Component({
  selector: 'app-customer-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-search.component.html',
})
export class CustomerSearchComponent {
  @Input() isModal: boolean = false;
  @Output() select = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  customers: any[] = [];
  filtered: any[] = [];
  search = '';
  isLoading = false;

  constructor(private customersService: CustomersService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.isLoading = true;
    this.customersService.getAll().subscribe({
      next: (c) => { this.customers = c || []; this.filtered = this.customers; this.isLoading = false; },
      error: () => { this.customers = []; this.filtered = []; this.isLoading = false; }
    });
  }

  onSearchChange() {
    const q = (this.search || '').toString().trim().toLowerCase();
    if (!q) { this.filtered = this.customers; return; }
    this.filtered = this.customers.filter(c => {
      const full = `${c.firstName || ''} ${c.lastName || ''} ${c.email || ''} ${c.phone || ''} ${c.customerCode || ''}`.toLowerCase();
      return full.indexOf(q) !== -1;
    });
  }

  onSelect(c: any) {
    this.select.emit(c);
  }

  onCancel() {
    this.cancel.emit();
  }
}
