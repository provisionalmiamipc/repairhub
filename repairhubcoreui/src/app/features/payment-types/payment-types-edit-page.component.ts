import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentTypesService } from '../../shared/services/payment-types.service';
import { PaymentTypes } from '../../shared/models/PaymentTypes';
import { PaymentTypesFormComponent } from './payment-types-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-types-edit-page',
  standalone: true,
  imports: [CommonModule, PaymentTypesFormComponent],
  template: `
    <h1 *ngIf="!isNew">Editar Tipo</h1>
    <h1 *ngIf="isNew">Nuevo Tipo</h1>
    <app-payment-types-form
      [paymentType]="paymentType"
      (save)="onSave($event)"
    ></app-payment-types-form>
  `,
})
export class PaymentTypesEditPageComponent {
  paymentType: PaymentTypes | null = null;
  isNew = false;

  constructor(
    private service: PaymentTypesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(t => (this.paymentType = t));
    }
  }

  onSave(data: Partial<PaymentTypes>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.paymentType) {
      this.service.update(this.paymentType.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }
}
