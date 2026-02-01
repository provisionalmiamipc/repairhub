import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { OrdersItem } from '../../shared/models/OrdersItem';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders-item-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './orders-item-form.component.html',
})
export class OrdersItemFormComponent {
  @Input() ordersItem: OrdersItem | null = null;
  @Output() save = new EventEmitter<Partial<OrdersItem>>();
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      quantity: [0, [Validators.required, Validators.min(1)]],
      cost: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
      image: [''],
      link: [''],
      condition: ['', Validators.required],
      received: [false],
      note: [''],
    });
  }

  ngOnChanges() {
    if (this.ordersItem) {
      this.form.patchValue({
        quantity: this.ordersItem.quantity,
        cost: this.ordersItem.cost,
        price: this.ordersItem.price,
        discount: this.ordersItem.discount,
        image: this.ordersItem.image,
        link: this.ordersItem.link,
        condition: this.ordersItem.condition,
        received: this.ordersItem.received,
        note: this.ordersItem.note,
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.save.emit({ ...this.ordersItem, ...this.form.value });
    }
  }
}
