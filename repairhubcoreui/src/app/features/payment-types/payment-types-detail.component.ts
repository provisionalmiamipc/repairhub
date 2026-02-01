import { Component, Input } from '@angular/core';
import { PaymentTypes } from '../../shared/models/PaymentTypes';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-types-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-types-detail.component.html',
})
export class PaymentTypesDetailComponent {
  @Input() paymentType: PaymentTypes | null = null;
}
