import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { Stores } from '../../shared/models/Stores';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@coreui/angular';


@Component({
  selector: 'app-stores-list',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './stores-list.component.html',
})
export class StoresListComponent {
  @Input() items: Observable<Stores[]> | null = null;
  @Output() selectStores = new EventEmitter<Stores>();
  @Output() editStores = new EventEmitter<Stores>();
  @Output() deleteStores = new EventEmitter<Stores>();

  onSelect(item: Stores) {
    this.selectStores.emit(item);
  }

  onEdit(item: Stores) {
    this.editStores.emit(item);
  }

  onDelete(item: Stores) {
    this.deleteStores.emit(item);
  }
}
