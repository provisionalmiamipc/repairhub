import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemTypesService } from '../../shared/services/item-types.service';
import { ItemTypes } from '../../shared/models/ItemTypes';
import { ItemTypesDetailComponent } from './item-types-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-item-types-detail-page',
  standalone: true,
  imports: [CommonModule, ItemTypesDetailComponent],
  template: `
    <h1>Detalle de Tipo de Item</h1>
    <app-item-types-detail [itemType]="itemType"></app-item-types-detail>
    <button (click)="goBack()">Volver</button>
    <button (click)="onEdit()">Editar</button>
  `,
})
export class ItemTypesDetailPageComponent {
  itemType: ItemTypes | null = null;

  constructor(
    private service: ItemTypesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(t => (this.itemType = t));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.itemType) {
      this.router.navigate(['../', this.itemType.id, 'edit'], { relativeTo: this.route });
    }
  }
}
