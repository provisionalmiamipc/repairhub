import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentTypesService } from '../../shared/services/payment-types.service';
import { PaymentTypes } from '../../shared/models/PaymentTypes';
import { PaymentTypesListComponent } from './payment-types-list.component';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-payment-types-list-page',
  standalone: true,
  imports: [CommonModule, PaymentTypesListComponent],
  template: `
    <div class="container-lg py-4">
      <div class="row mb-4">
        <div class="col-md-8">
          <h1 class="h2">Tipos de Pago</h1>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" (click)="onCreate()">
            <i class="cil-plus me-2"></i> New Type
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

      <app-payment-types-list
        *ngIf="!(loading$ | async)"
        [items]="paymentTypes$"
        (selectPaymentType)="onSelect($event)"
        (editPaymentType)="onEdit($event)"
        (deletePaymentType)="onDelete($event)">
      </app-payment-types-list>
    </div>
  `,
})
export class PaymentTypesListPageComponent implements OnInit, OnDestroy {
  paymentTypes$!: Observable<PaymentTypes[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  private destroy$ = new Subject<void>();

  constructor(
    private paymentTypesService: PaymentTypesService,
    private router: Router
  ) {
    this.paymentTypes$ = this.paymentTypesService.data$;
    this.loading$ = this.paymentTypesService.loading$;
    this.error$ = this.paymentTypesService.error$;
  }

  ngOnInit(): void {
    this.paymentTypesService.getAll();
  }

  onCreate(): void {
    this.router.navigate(['/payment-types', 'new']);
  }

  onSelect(paymentType: PaymentTypes): void {
    this.router.navigate(['/payment-types', paymentType.id]);
  }

  onEdit(paymentType: PaymentTypes): void {
    this.router.navigate(['/payment-types', paymentType.id, 'edit']);
  }

  onDelete(paymentType: PaymentTypes): void {
    if (confirm(`Delete ${paymentType.type}?`)) {
      this.paymentTypesService
        .delete(paymentType.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.paymentTypesService.getAll();
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
