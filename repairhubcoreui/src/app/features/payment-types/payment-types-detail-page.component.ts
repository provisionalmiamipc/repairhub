import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentTypesService } from '../../shared/services/payment-types.service';
import { PaymentTypes } from '../../shared/models/PaymentTypes';
import { PaymentTypesDetailComponent } from './payment-types-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-types-detail-page',
  standalone: true,
  imports: [CommonModule, PaymentTypesDetailComponent],
  template: `
    <h1>Detalle de Tipo de Pago</h1>
    <app-payment-types-detail [paymentType]="paymentType"></app-payment-types-detail>
    <button (click)="goBack()">Volver</button>
    <button (click)="onEdit()">Editar</button>
  `,
})
export class PaymentTypesDetailPageComponent {
  paymentType: PaymentTypes | null = null;

  constructor(
    private service: PaymentTypesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(t => (this.paymentType = t));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.paymentType) {
      this.router.navigate(['../', this.paymentType.id, 'edit'], { relativeTo: this.route });
    }
  }
}
