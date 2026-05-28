import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ReceivedPartsService } from './received-parts.service';
import { ReceivedPart } from '../../shared/models/ReceivedPart';

@Component({
  selector: 'app-received-parts-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="card p-3">
    <h3>{{model ? 'Edit' : 'New'}} Received Part</h3>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="mb-2">
        <label>Accessory</label>
        <input class="form-control" formControlName="accessory" autocapitalize="characters"
          (input)="uppercaseControlValue('accessory', $event)" />
      </div>
      <div class="mb-2">
        <label>Service Order Id</label>
        <input class="form-control" formControlName="serviceOrderId" type="number" />
      </div>
      <div class="mb-2">
        <label>Center Id</label>
        <input class="form-control" formControlName="centerId" type="number" />
      </div>
      <div class="mb-2">
        <label>Store Id</label>
        <input class="form-control" formControlName="storeId" type="number" />
      </div>
      <div class="mb-2">
        <label>Observations</label>
        <textarea class="form-control" formControlName="observations" autocapitalize="characters"
          (input)="uppercaseControlValue('observations', $event)"></textarea>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-primary" type="submit" [disabled]="form.invalid">Save</button>
        <button class="btn btn-secondary" type="button" (click)="cancel.emit()">Cancel</button>
      </div>
    </form>
  </div>
  `
})
export class ReceivedPartsFormComponent implements OnInit {
  @Input() model: ReceivedPart | null = null;
  @Output() saved = new EventEmitter<ReceivedPart>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder, private service: ReceivedPartsService) {
    this.form = this.fb.group({
      accessory: ['', Validators.required],
      serviceOrderId: [null, Validators.required],
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],
      observations: ['']
    });
  }

  ngOnInit(): void {
    if (this.model) {
      this.form.patchValue(this.model as any);
    }
  }

  uppercaseControlValue(controlName: 'accessory' | 'observations', event: Event): void {
    const field = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    const control = this.form.get(controlName);
    if (!field || !control) return;

    const selectionStart = field.selectionStart;
    const selectionEnd = field.selectionEnd;
    const upperValue = field.value.toLocaleUpperCase();
    field.value = upperValue;
    control.setValue(upperValue);

    if (selectionStart !== null && selectionEnd !== null) {
      field.setSelectionRange(selectionStart, selectionEnd);
    }
  }

  submit() {
    if (this.form.invalid) return;
    const payload = { ...this.model, ...this.form.value } as ReceivedPart;
    if (payload.id) {
      this.service.update(payload.id, payload).subscribe(res => this.saved.emit(res));
    } else {
      this.service.create(payload).subscribe(res => this.saved.emit(res));
    }
  }
}
