import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Customers } from '../../shared/models/Customers';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { CardComponent } from '@coreui/angular';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './customers-list.component.html',
})
export class CustomersListComponent {
  @Input() items: Observable<Customers[]> | null = null;
  @Output() selectCustomer = new EventEmitter<Customers>();
  @Output() editCustomer = new EventEmitter<Customers>();
  @Output() deleteCustomer = new EventEmitter<Customers>();

  getFullName(customer: Customers): string {
    return `${customer.firstName} ${customer.lastName}`;
  }

  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  onSelect(customer: Customers): void {
    this.selectCustomer.emit(customer);
  }

  onEdit(customer: Customers): void {
    this.editCustomer.emit(customer);
  }

  onDelete(customer: Customers): void {
    this.deleteCustomer.emit(customer);
  }
}
