import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryMovements } from '../../shared/models/InventoryMovements';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventory-movements-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventory-movements-form.component.html',
})
export class InventoryMovementsFormComponent {
  @Input() movement: Partial<InventoryMovements> | null = null;
  @Output() save = new EventEmitter<Partial<InventoryMovements>>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      itemId: [null, Validators.required],
      quantity: [null, Validators.required],
      movementType: [null, Validators.required],
      description: [''],
      createdAt: [null, Validators.required],
    });
  }

  ngOnChanges() {
    if (this.movement) {
      this.form.patchValue(this.movement);
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    }
  }

  // Form control getters
  get itemId() { return this.form.get('itemId'); }
  get quantity() { return this.form.get('quantity'); }
  get movementType() { return this.form.get('movementType'); }
  get description() { return this.form.get('description'); }
  get createdAt() { return this.form.get('createdAt'); }
}
