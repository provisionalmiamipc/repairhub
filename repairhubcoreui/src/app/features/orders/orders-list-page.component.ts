import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../../shared/services/orders.service';
import { Orders } from '../../shared/models/Orders';
import { OrdersListComponent } from './orders-list.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-orders-list-page',
  standalone: true,
  imports: [CommonModule, OrdersListComponent],
  template: `
    <div class="container-lg py-4">
      <div class="row mb-4">
        <div class="col-md-8">
          <h1 class="h2">Órdenes de Trabajo</h1>
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

      <app-orders-list
        *ngIf="!(loading$ | async)"
        [items]="orders$"
        (selectOrder)="onSelect($event)"
        (editOrder)="onEdit($event)"
        (deleteOrder)="onDelete($event)">
      </app-orders-list>
    </div>
  `,
})
export class OrdersListPageComponent implements OnInit, OnDestroy {
  orders$ = this.ordersService.data$;
  loading$ = this.ordersService.loading$;
  error$ = this.ordersService.error$;

  private destroy$ = new Subject<void>();

  constructor(
    private ordersService: OrdersService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.ordersService.getAll();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSelect(order: Orders) {
    if (order.id) {
      this.router.navigate(['/orders', order.id]);
    }
  }

  onEdit(order: Orders) {
    if (order.id) {
      this.router.navigate(['/orders', order.id, 'edit']);
    }
  }

  onDelete(order: Orders) {
    if (order.id && confirm('¿Eliminar esta orden?')) {
      this.ordersService.delete(order.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => this.ordersService.getAll(),
        error: (err) => console.error('Error al eliminar:', err)
      });
    }
  }

  onCreate() {
    this.router.navigate(['/orders/new']);
  }

  clearError() {
    this.ordersService.clearError();
  }
}
