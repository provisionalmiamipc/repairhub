import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServiceOrderRequeste } from '../../shared/models/ServiceOrderRequeste';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-service-order-requeste-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-order-requeste-form.component.html',
})
export class ServiceOrderRequesteFormComponent {
  @Input() request: Partial<ServiceOrderRequeste> | null = null;
  @Output() save = new EventEmitter<Partial<ServiceOrderRequeste>>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      status: [null, Validators.required],
      cloused: [false, Validators.required],
      canceled: [false, Validators.required],
      createdAt: [null, Validators.required],
      updatedAt: [null, Validators.required],
    });
  }

  ngOnChanges() {
    if (this.request) {
      this.form.patchValue(this.request);
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    }
  }
}
