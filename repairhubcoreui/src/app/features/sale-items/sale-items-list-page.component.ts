import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SaleItemsService } from '../../shared/services/sale-items.service';
import { SaleItems } from '../../shared/models/SaleItems';
import { SaleItemsListComponent } from './sale-items-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sale-items-list-page',
  standalone: true,
  imports: [CommonModule, SaleItemsListComponent],
  template: `
    <h1>Items de Venta</h1>
    <button (click)="onCreate()">New Item</button>
    <app-sale-items-list
      [saleItems]="saleItems"
      (select)="onSelect($event)"
      (edit)="onEdit($event)"
      (delete)="onDelete($event)"
    ></app-sale-items-list>
  `,
})
export class SaleItemsListPageComponent {
  saleItems: SaleItems[] = [];

  constructor(
    private service: SaleItemsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.load();
  }

  load() {
    this.service.getAll().subscribe(items => (this.saleItems = items));
  }

  onSelect(item: SaleItems) {
    this.router.navigate(['./', item.id], { relativeTo: this.route });
  }

  onEdit(item: SaleItems) {
    this.router.navigate(['./', item.id, 'edit'], { relativeTo: this.route });
  }

  onDelete(item: SaleItems) {
    if (confirm('Delete this item?')) {
      this.service.delete(item.id).subscribe(() => this.load());
    }
  }

  onCreate() {
    this.router.navigate(['./new'], { relativeTo: this.route });
  }
}
