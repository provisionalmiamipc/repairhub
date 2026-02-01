import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { Items } from '../../shared/models/Items';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@coreui/angular';

@Component({
  selector: 'app-items-list',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './items-list.component.html',
})
export class ItemsListComponent {
  @Input() items: Observable<Items[]> | null = null;
  @Output() selectItems = new EventEmitter<Items>();
  @Output() editItems = new EventEmitter<Items>();
  @Output() deleteItems = new EventEmitter<Items>();

  onSelect(item: Items) {
    this.selectItems.emit(item);
  }

  onEdit(item: Items) {
    this.editItems.emit(item);
  }

  onDelete(item: Items) {
    this.deleteItems.emit(item);
  }
}
