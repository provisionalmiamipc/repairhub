import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmployeesService } from '../../shared/services/employees.service';
import { Employees } from '../../shared/models/Employees';
import { EmployeesListComponent } from './employees-list.component';

@Component({
  selector: 'app-employees-list-page',
  standalone: true,
  imports: [CommonModule, EmployeesListComponent],
  template: `
    <div class="container-lg py-4">
      <div class="row mb-4">
        <div class="col-md-8">
          <h1 class="h2">Empleados</h1>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" (click)="onCreate()">
            <i class="cil-plus me-2"></i> Nuevo Empleado
          </button>
        </div>
      </div>

      <div *ngIf="error$ | async as error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error }}
        <button type="button" class="btn-close" (click)="clearError()"></button>
      </div>

      <div *ngIf="loading$ | async">
        <div class="text-center py-5">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>

      <app-employees-list
        *ngIf="!(loading$ | async)"
        [items]="employees$"
        (selectEmployee)="onSelect($event)"
        (editEmployee)="onEdit($event)"
        (deleteEmployee)="onDelete($event)">
      </app-employees-list>
    </div>
  `,
})
export class EmployeesListPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  employees$: Observable<Employees[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(
    private employeesService: EmployeesService,
    private router: Router
  ) {
    this.employees$ = this.employeesService.data$;
    this.loading$ = this.employeesService.loading$;
    this.error$ = this.employeesService.error$;
  }

  ngOnInit(): void {
    this.employeesService.getAll();
  }

  onCreate(): void {
    this.router.navigate(['/employees', 'new']);
  }

  onSelect(employee: Employees): void {
    this.router.navigate(['/employees', employee.id]);
  }

  onEdit(employee: Employees): void {
    this.router.navigate(['/employees', employee.id, 'edit']);
  }

  onDelete(employee: Employees): void {
    if (confirm(`¿Eliminar empleado ${employee.firstName} ${employee.lastName}?`)) {
      this.employeesService
        .delete(employee.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.employeesService.getAll();
        });
    }
  }

  clearError(): void {
    // Could implement error clearing logic
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
