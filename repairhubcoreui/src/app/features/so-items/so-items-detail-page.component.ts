import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SOItemsService } from '../../shared/services/so-items.service';
import { SOItems } from '../../shared/models/SOItems';
import { SOItemsDetailComponent } from './so-items-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-so-items-detail-page',
  standalone: true,
  imports: [CommonModule, SOItemsDetailComponent],
  template: `
    <h1>Detalle de Item</h1>
    <app-so-items-detail [soItem]="soItem"></app-so-items-detail>
    <button (click)="goBack()">Volver</button>
    <button (click)="onEdit()">Editar</button>
  `,
})
export class SOItemsDetailPageComponent {
  soItem: SOItems | null = null;

  constructor(
    private service: SOItemsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(s => (this.soItem = s));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.soItem) {
      this.router.navigate(['../', this.soItem.id, 'edit'], { relativeTo: this.route });
    }
  }
}
