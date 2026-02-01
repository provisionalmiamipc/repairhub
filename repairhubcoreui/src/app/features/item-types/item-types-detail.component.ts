import { Component, Input } from '@angular/core';
import { ItemTypes } from '../../shared/models/ItemTypes';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-item-types-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-types-detail.component.html',
})
export class ItemTypesDetailComponent {
  @Input() itemType: ItemTypes | null = null;
}
