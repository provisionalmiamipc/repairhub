import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Sales } from '../../shared/models/Sales';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sales-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './sales-form.component.html',
})
export class SalesFormComponent {
  @Input() sale: Sales | null = null;
  @Output() save = new EventEmitter<Partial<Sales>>();
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      totalCost: ['', Validators.required],
      totalPrice: [0, [Validators.required, Validators.min(0)]],
      totalDiscount: [0, [Validators.min(0)]],
      cloused: [false],
      canceled: [false],
    });
  }

  ngOnChanges() {
    if (this.sale) {
      this.form.patchValue({
        totalCost: this.sale.totalCost,
        totalPrice: this.sale.totalPrice,
        totalDiscount: this.sale.totalDiscount,
        cloused: this.sale.cloused,
        canceled: this.sale.canceled,
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.save.emit({ ...this.sale, ...this.form.value });
    }
  }
}
