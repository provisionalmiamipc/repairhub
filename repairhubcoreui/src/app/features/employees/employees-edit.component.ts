import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeesService } from '../../shared/services/employees.service';
import { Employees } from '../../shared/models/Employees';
import { CommonModule } from '@angular/common';
import { EmployeesFormComponent } from './employees-form.component';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-employees-edit',
  standalone: true,
  //templateUrl: './employees-edit.component.html',
  imports: [
    CommonModule,
    EmployeesFormComponent,
    ReactiveFormsModule,
  ],
  template: `
    <app-employees-form
      [employee]="employee"
      (save)="onSave($event)"
      (cancel)="onCancel()">
    </app-employees-form>
  `
})
export class EmployeesEditComponent implements OnInit {
  employee: Employees | null = null;
  loading = false;
  isNew = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: EmployeesService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(e => (this.employee = e));
    }
  }

  onSave(data: Partial<Employees>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['/employees'], { relativeTo: this.route }));
    } else if (this.employee) {
      this.service.update(this.employee.id, data).subscribe(() => this.router.navigate(['/employees'], { relativeTo: this.route }));
    }
  }

  onCancel(): void {
    // Navegar atrás o limpiar
    window.history.back();
  }
}
