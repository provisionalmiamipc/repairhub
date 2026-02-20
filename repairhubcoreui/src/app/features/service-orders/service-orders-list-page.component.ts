import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ServiceOrdersService } from '../../shared/services/service-orders.service';
import { ServiceOrders } from '../../shared/models/ServiceOrders';
import { ServiceOrdersListComponent } from './service-orders-list.component';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

@Component({
  selector: 'app-service-orders-list-page',
  standalone: true,
  imports: [CommonModule, ServiceOrdersListComponent],
  template: `
    <div class="container-lg py-4">
      <div class="row mb-4">
          <div class="col-md-8">
          <h1 class="h2">Service Orders</h1>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" (click)="onCreate()">
            <i class="cil-plus me-2"></i> New Order
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

      <app-service-orders-list
        *ngIf="!(loading$ | async)"
        [items]="serviceOrders$"
        (selectServiceOrder)="onSelect($event)"
        (editServiceOrder)="onEdit($event)"
        (deleteServiceOrder)="onDelete($event)">
      </app-service-orders-list>
    </div>
  `,
})
export class ServiceOrdersListPageComponent implements OnInit, OnDestroy {
  serviceOrders$: any;
  loading$: any;
  error$: any;

  private destroy$ = new Subject<void>();

  constructor(
    private serviceOrdersService: ServiceOrdersService,
    private router: Router,
    private authService: AuthService
  ) {}
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
    // Initialize observables after constructor-injected services are available
    // Apply filtering: Experts (non center-admin) see only orders they created or were assigned to
    this.serviceOrders$ = this.serviceOrdersService.data$.pipe(
      map((orders: ServiceOrders[]) => {
        const employee = this.authService.getCurrentEmployee();
        if (employee && employee.employee_type === 'Expert' && !employee.isCenterAdmin) {
          return orders.filter(o => o.createdById === employee.id || o.assignedTechId === employee.id);
        }
        return orders;
      })
    );
    this.loading$ = this.serviceOrdersService.loading$;
    this.error$ = this.serviceOrdersService.error$;

    this.serviceOrdersService.getAll();
  }

  onCreate(): void {
    this.router.navigate(['/service-orders', 'new']);
  }

  onSelect(serviceOrder: ServiceOrders): void {
    this.router.navigate(['/service-orders', serviceOrder.id]);
  }

  onEdit(serviceOrder: ServiceOrders): void {
    this.router.navigate(['/service-orders', serviceOrder.id, 'edit']);
  }

  onDelete(serviceOrder: ServiceOrders): void {
    if (confirm(`Delete service order ${serviceOrder.id}?`)) {
      this.serviceOrdersService
        .delete(serviceOrder.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.serviceOrdersService.getAll();
        });
    }

  /*clearError(): void {
    // Could implement error clearing logic
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }*/
}
}