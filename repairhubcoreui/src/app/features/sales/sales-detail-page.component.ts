import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SalesService } from '../../shared/services/sales.service';
import { Sales } from '../../shared/models/Sales';
import { SalesDetailComponent } from './sales-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sales-detail-page',
  standalone: true,
  imports: [CommonModule, SalesDetailComponent],
  template: `
    <h1>Detalle de Venta</h1>
    <app-sales-detail [sale]="sale"></app-sales-detail>
    <button (click)="goBack()">Volver</button>
    <button (click)="onEdit()">Edit</button>
  `,
})
export class SalesDetailPageComponent {
  sale: Sales | null = null;

  constructor(
    private service: SalesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(s => (this.sale = s));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.sale) {
      this.router.navigate(['../', this.sale.id, 'edit'], { relativeTo: this.route });
    }
  }
}
