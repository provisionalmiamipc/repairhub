import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Orders } from '../../shared/models/Orders';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './orders-form.component.html',
})
export class OrdersFormComponent {
  @Input() order: Orders | null = null;
  @Output() save = new EventEmitter<Partial<Orders>>();
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      totalPrice: [0, [Validators.required, Validators.min(0)]],
      totalCost: [0, [Validators.required, Validators.min(0)]],
      tax: [0, [Validators.min(0)]],
      advancePayment: [0, [Validators.min(0)]],
      note: [''],
      cloused: [false],
      canceled: [false],
    });
  }

  ngOnChanges() {
    if (this.order) {
      this.form.patchValue({
        totalPrice: this.order.totalPrice,
        totalCost: this.order.totalCost,
        tax: this.order.tax,
        advancePayment: this.order.advancePayment,
        note: this.order.note,
        cloused: this.order.cloused,
        canceled: this.order.canceled,
      });
    }
  }

  // Form getters for template access
  get totalPrice() { return this.form.get('totalPrice'); }
  get totalCost() { return this.form.get('totalCost'); }
  get tax() { return this.form.get('tax'); }
  get advancePayment() { return this.form.get('advancePayment'); }
  get note() { return this.form.get('note'); }
  get cloused() { return this.form.get('cloused'); }
  get canceled() { return this.form.get('canceled'); }

  onSubmit() {
    if (this.form.valid) {
      this.save.emit({ ...this.order, ...this.form.value });
    }
  }
}
