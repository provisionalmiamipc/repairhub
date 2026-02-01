import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Employees } from '../../shared/models/Employees';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { CardComponent } from '@coreui/angular';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './employees-list.component.html',
})
export class EmployeesListComponent {
  @Input() items: Observable<Employees[]> | null = null;
  @Output() selectEmployee = new EventEmitter<Employees>();
  @Output() editEmployee = new EventEmitter<Employees>();
  @Output() deleteEmployee = new EventEmitter<Employees>();

  getFullName(employee: Employees): string {
    return `${employee.firstName} ${employee.lastName}`;
  }

  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  onSelect(employee: Employees): void {
    this.selectEmployee.emit(employee);
  }

  onEdit(employee: Employees): void {
    this.editEmployee.emit(employee);
  }

  onDelete(employee: Employees): void {
    this.deleteEmployee.emit(employee);
  }
}
