import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryMovementsService } from '../../shared/services/inventory-movements.service';
import { InventoryMovements } from '../../shared/models/InventoryMovements';
import { InventoryMovementsFormComponent } from './inventory-movements-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inventory-movements-edit-page',
  standalone: true,
  imports: [CommonModule, InventoryMovementsFormComponent],
  template: `
    <h1 *ngIf="!isNew">Edit Movement</h1>
    <h1 *ngIf="isNew">New Movement</h1>
    <app-inventory-movements-form
      [movement]="movement"
      (save)="onSave($event)"
    ></app-inventory-movements-form>
  `,
})
export class InventoryMovementsEditPageComponent {
  movement: InventoryMovements | null = null;
  isNew = false;

  constructor(
    private service: InventoryMovementsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(m => (this.movement = m));
    }
  }

  onSave(data: Partial<InventoryMovements>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.movement) {
      this.service.update(this.movement.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }
}
