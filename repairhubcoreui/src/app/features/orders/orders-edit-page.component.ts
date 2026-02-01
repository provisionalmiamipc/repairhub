import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../../shared/services/orders.service';
import { Orders } from '../../shared/models/Orders';
import { OrdersFormComponent } from './orders-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders-edit-page',
  standalone: true,
  imports: [CommonModule, OrdersFormComponent],
  template: `
    <h1 *ngIf="!isNew">Editar Orden</h1>
    <h1 *ngIf="isNew">Nueva Orden</h1>
    <app-orders-form
      [order]="order"
      (save)="onSave($event)"
    ></app-orders-form>
  `,
})
export class OrdersEditPageComponent {
  order: Orders | null = null;
  isNew = false;

  constructor(
    private service: OrdersService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(o => (this.order = o));
    }
  }

  onSave(data: Partial<Orders>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.order) {
      this.service.update(this.order.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }
}
