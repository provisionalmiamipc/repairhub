import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemsService } from '../../shared/services/items.service';
import { Items } from '../../shared/models/Items';
import { ItemsFormComponent } from './items-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-items-edit-page',
  standalone: true,
  imports: [CommonModule, ItemsFormComponent],
  template: `
    <h1 *ngIf="!isNew">Edit Item</h1>
    <h1 *ngIf="isNew">New Item</h1>
    <app-items-form
      [item]="item"
      (save)="onSave($event)"
    ></app-items-form>
  `,
})
export class ItemsEditPageComponent {
  item: Items | null = null;
  isNew = false;

  constructor(
    private service: ItemsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(i => (this.item = i));
    }
  }

  onSave(data: Partial<Items>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.item) {
      this.service.update(this.item.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }
}
