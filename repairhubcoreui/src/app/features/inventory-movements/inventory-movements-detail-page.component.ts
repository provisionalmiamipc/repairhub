import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryMovementsService } from '../../shared/services/inventory-movements.service';
import { InventoryMovements } from '../../shared/models/InventoryMovements';
import { InventoryMovementsDetailComponent } from './inventory-movements-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inventory-movements-detail-page',
  standalone: true,
  imports: [CommonModule, InventoryMovementsDetailComponent],
  template: `
    <h1>Detalle de Movimiento</h1>
    <app-inventory-movements-detail [movement]="movement"></app-inventory-movements-detail>
    <button (click)="goBack()">Volver</button>
    <button (click)="onEdit()">Editar</button>
  `,
})
export class InventoryMovementsDetailPageComponent {
  movement: InventoryMovements | null = null;

  constructor(
    private service: InventoryMovementsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(m => (this.movement = m));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.movement) {
      this.router.navigate(['../', this.movement.id, 'edit'], { relativeTo: this.route });
    }
  }
}
