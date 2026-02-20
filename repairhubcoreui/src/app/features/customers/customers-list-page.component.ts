import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomersService } from '../../shared/services/customers.service';
import { Customers } from '../../shared/models/Customers';
import { CustomersListComponent } from './customers-list.component';

@Component({
  selector: 'app-customers-list-page',
  standalone: true,
  imports: [CommonModule, CustomersListComponent],
  template: `
    <div class="container-lg py-4">
      <div class="row mb-4">
        <div class="col-md-8">
          <h1 class="h2">Customers</h1>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" (click)="onCreate()">
            <i class="cil-plus me-2"></i> New Customer
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
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>

      <app-customers-list
        *ngIf="!(loading$ | async)"
        [items]="customers$"
        (selectCustomer)="onSelect($event)"
        (editCustomer)="onEdit($event)"
        (deleteCustomer)="onDelete($event)">
      </app-customers-list>
    </div>
  `,
})
export class CustomersListPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  customers$: Observable<Customers[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(
    private customersService: CustomersService,
    private router: Router
  ) {
    this.customers$ = this.customersService.data$;
    this.loading$ = this.customersService.loading$;
    this.error$ = this.customersService.error$;
  }

  ngOnInit(): void {
    this.customersService.getAll();
  }

  onCreate(): void {
    this.router.navigate(['/customers', 'new']);
  }

  onSelect(customer: Customers): void {
    this.router.navigate(['/customers', customer.id]);
  }

  onEdit(customer: Customers): void {
    this.router.navigate(['/customers', customer.id, 'edit']);
  }

  onDelete(customer: Customers): void {
    if (confirm(`Delete customer ${customer.firstName} ${customer.lastName}?`)) {
      this.customersService
        .delete(customer.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.customersService.getAll();
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
