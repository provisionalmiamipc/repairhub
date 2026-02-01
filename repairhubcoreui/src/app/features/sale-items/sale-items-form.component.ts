import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SaleItems } from '../../shared/models/SaleItems';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sale-items-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './sale-items-form.component.html',
})
export class SaleItemsFormComponent {
  @Input() saleItem: SaleItems | null = null;
  @Output() save = new EventEmitter<Partial<SaleItems>>();
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      quantity: [0, [Validators.required, Validators.min(1)]],
      cost: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
    });
  }

  ngOnChanges() {
    if (this.saleItem) {
      this.form.patchValue({
        quantity: this.saleItem.quantity,
        cost: this.saleItem.cost,
        price: this.saleItem.price,
        discount: this.saleItem.discount,
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.save.emit({ ...this.saleItem, ...this.form.value });
    }
  }
}
