import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import {
  PublicOrderStatus,
  PublicOrderStatusService,
} from '../../shared/services/public-order-status.service';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './track-order.component.html',
  styleUrl: './track-order.component.scss',
})
export class TrackOrderComponent {
  private readonly fb = inject(FormBuilder);
  private readonly publicOrderStatusService = inject(PublicOrderStatusService);

  readonly form = this.fb.nonNullable.group({
    contact: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    orderNumber: ['', [Validators.required, Validators.maxLength(40)]],
  });

  isLoading = false;
  order: PublicOrderStatus | null = null;
  errorMessage = '';

  submit(): void {
    this.form.markAllAsTouched();
    this.errorMessage = '';

    if (this.form.invalid || this.isLoading) return;

    this.isLoading = true;
    this.order = null;

    this.publicOrderStatusService.track({
      contact: this.form.controls.contact.value.trim(),
      orderNumber: this.form.controls.orderNumber.value.trim(),
    }).pipe(
      finalize(() => this.isLoading = false),
    ).subscribe({
      next: order => this.order = order,
      error: err => {
        this.errorMessage = err?.error?.message || 'We could not find an order matching those details.';
      },
    });
  }

  resetLookup(): void {
    this.order = null;
    this.errorMessage = '';
    this.form.controls.orderNumber.setValue('');
    this.form.controls.orderNumber.markAsUntouched();
  }

  fieldInvalid(field: 'contact' | 'orderNumber'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  formatDate(value: string): string {
    if (!value) return 'Pending';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  }

  get statusClass(): string {
    const normalized = String(this.order?.currentStatus ?? '').toLowerCase();
    if (this.order?.isCanceled || normalized.includes('cancel')) return 'status-danger';
    if (this.order?.isClosed || normalized.includes('deliver') || normalized.includes('pickup')) {
      return 'status-success';
    }
    if (normalized.includes('pending')) return 'status-warning';
    return 'status-active';
  }
}
