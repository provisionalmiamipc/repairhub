import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SalesService } from '../../shared/services/sales.service';
import { Sales } from '../../shared/models/Sales';
import { SalesListComponent } from './sales-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sales-list-page',
  standalone: true,
  imports: [CommonModule, SalesListComponent],
  template: `
    <h1>Ventas</h1>
    <button (click)="onCreate()">Nueva Venta</button>
    <app-sales-list
      [sales]="sales"
      (select)="onSelect($event)"
      (edit)="onEdit($event)"
      (delete)="onDelete($event)"
    ></app-sales-list>
  `,
})
export class SalesListPageComponent {
  sales: Sales[] = [];

  constructor(
    private service: SalesService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.load();
  }

  load() {
    this.service.getAll().subscribe(sales => (this.sales = sales));
  }

  onSelect(sale: Sales) {
    this.router.navigate(['./', sale.id], { relativeTo: this.route });
  }

  onEdit(sale: Sales) {
    this.router.navigate(['./', sale.id, 'edit'], { relativeTo: this.route });
  }

  onDelete(sale: Sales) {
    if (confirm('¿Eliminar esta venta?')) {
      this.service.delete(sale.id).subscribe(() => this.load());
    }
  }

  onCreate() {
    this.router.navigate(['./new'], { relativeTo: this.route });
  }
}
