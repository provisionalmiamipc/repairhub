import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemTypesService } from '../../shared/services/item-types.service';
import { ItemTypes } from '../../shared/models/ItemTypes';
import { ItemTypesListComponent } from './item-types-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-item-types-list-page',
  standalone: true,
  imports: [CommonModule, ItemTypesListComponent],
  template: `
    <h1>Tipos de Item</h1>
    <button (click)="onCreate()">New Type</button>
    <app-item-types-list
      [itemTypes]="itemTypes"
      (select)="onSelect($event)"
      (edit)="onEdit($event)"
      (delete)="onDelete($event)"
    ></app-item-types-list>
  `,
})
export class ItemTypesListPageComponent {
  itemTypes: ItemTypes[] = [];

  constructor(
    private service: ItemTypesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.load();
  }

  load() {
    this.service.getAll().subscribe(itemTypes => (this.itemTypes = itemTypes));
  }

  onSelect(itemType: ItemTypes) {
    this.router.navigate(['./', itemType.id], { relativeTo: this.route });
  }

  onEdit(itemType: ItemTypes) {
    this.router.navigate(['./', itemType.id, 'edit'], { relativeTo: this.route });
  }

  onDelete(itemType: ItemTypes) {
    if (confirm('Delete this type?')) {
      this.service.delete(itemType.id).subscribe(() => this.load());
    }
  }

  onCreate() {
    this.router.navigate(['./new'], { relativeTo: this.route });
  }
}
