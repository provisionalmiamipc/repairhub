import { Component, Input } from '@angular/core';
import { InventoryMovements } from '../../shared/models/InventoryMovements';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inventory-movements-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory-movements-detail.component.html',
})
export class InventoryMovementsDetailComponent {
  @Input() movement: InventoryMovements | null = null;
}
