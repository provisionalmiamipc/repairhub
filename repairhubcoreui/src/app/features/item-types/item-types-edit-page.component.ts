import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemTypesService } from '../../shared/services/item-types.service';
import { ItemTypes } from '../../shared/models/ItemTypes';
import { ItemTypesFormComponent } from './item-types-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-item-types-edit-page',
  standalone: true,
  imports: [CommonModule, ItemTypesFormComponent],
  template: `
    <h1 *ngIf="!isNew">Edit Type</h1>
    <h1 *ngIf="isNew">New Type</h1>
    <app-item-types-form
      [itemType]="itemType"
      (save)="onSave($event)"
    ></app-item-types-form>
  `,
})
export class ItemTypesEditPageComponent {
  itemType: ItemTypes | null = null;
  isNew = false;

  constructor(
    private service: ItemTypesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(t => (this.itemType = t));
    }
  }

  onSave(data: Partial<ItemTypes>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.itemType) {
      this.service.update(this.itemType.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }
}
