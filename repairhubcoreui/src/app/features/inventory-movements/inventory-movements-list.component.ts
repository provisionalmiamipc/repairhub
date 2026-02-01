import { Component, Input, Output, EventEmitter } from '@angular/core';
import { InventoryMovements } from '../../shared/models/InventoryMovements';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { CardComponent } from '@coreui/angular';

@Component({
  selector: 'app-inventory-movements-list',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './inventory-movements-list.component.html',
})
export class InventoryMovementsListComponent {
  @Input() items: Observable<InventoryMovements[]> | null = null;
  @Output() selectMovement = new EventEmitter<InventoryMovements>();
  @Output() editMovement = new EventEmitter<InventoryMovements>();
  @Output() deleteMovement = new EventEmitter<InventoryMovements>();

  onSelect(movement: InventoryMovements): void {
    this.selectMovement.emit(movement);
  }

  onEdit(movement: InventoryMovements): void {
    this.editMovement.emit(movement);
  }

  onDelete(movement: InventoryMovements): void {
    this.deleteMovement.emit(movement);
  }
}
