import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Centers } from '../../shared/models/Centers';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@coreui/angular';

@Component({
  selector: 'app-centers-list',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './centers-list.component.html',
})
export class CentersListComponent {
  @Input() items: Observable<Centers[]> | null = null;
  @Output() selectCenters = new EventEmitter<Centers>();
  @Output() editCenters = new EventEmitter<Centers>();
  @Output() deleteCenters = new EventEmitter<Centers>();

  onSelect(item: Centers) {
    this.selectCenters.emit(item);
  }

  onEdit(item: Centers) {
    this.editCenters.emit(item);
  }

  onDelete(item: Centers) {
    this.deleteCenters.emit(item);
  }
}
