import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PaymentTypes } from '../../shared/models/PaymentTypes';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { CardComponent } from '@coreui/angular';

@Component({
  selector: 'app-payment-types-list',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './payment-types-list.component.html',
})
export class PaymentTypesListComponent {
  @Input() items: Observable<PaymentTypes[]> | null = null;
  @Output() selectPaymentType = new EventEmitter<PaymentTypes>();
  @Output() editPaymentType = new EventEmitter<PaymentTypes>();
  @Output() deletePaymentType = new EventEmitter<PaymentTypes>();

  onSelect(paymentType: PaymentTypes): void {
    this.selectPaymentType.emit(paymentType);
  }

  onEdit(paymentType: PaymentTypes): void {
    this.editPaymentType.emit(paymentType);
  }

  onDelete(paymentType: PaymentTypes): void {
    this.deletePaymentType.emit(paymentType);
  }
}
