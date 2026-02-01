import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServiceOrdersService } from '../../shared/services/service-orders.service';
import { ServiceOrders } from '../../shared/models/ServiceOrders';
import { ServiceOrdersListComponent } from './service-orders-list.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-service-orders-list-page',
  standalone: true,
  imports: [CommonModule, ServiceOrdersListComponent],
  template: `
    <div class="container-lg py-4">
      <div class="row mb-4">
        <div class="col-md-8">
          <h1 class="h2">Órdenes de Servicio</h1>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" (click)="onCreate()">
            <i class="cil-plus me-2"></i> Nueva Orden
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
  serviceOrders$ = this.serviceOrdersService.data$;
  loading$ = this.serviceOrdersService.loading$;
  error$ = this.serviceOrdersService.error$;

  private destroy$ = new Subject<void>();

  constructor(
    private serviceOrdersService: ServiceOrdersService,
    private router: Router
  ) {}

  ngOnInit(): void {
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
    if (confirm(`¿Eliminar orden de servicio ${serviceOrder.id}?`)) {
      this.serviceOrdersService
        .delete(serviceOrder.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.serviceOrdersService.getAll();
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
