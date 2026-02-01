import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ItemTypes } from '../../shared/models/ItemTypes';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-item-types-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-types-list.component.html',
})
export class ItemTypesListComponent {
  @Input() itemTypes: ItemTypes[] = [];
  @Output() select = new EventEmitter<ItemTypes>();
  @Output() edit = new EventEmitter<ItemTypes>();
  @Output() delete = new EventEmitter<ItemTypes>();
}
