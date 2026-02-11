import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SaleItemsService } from '../../shared/services/sale-items.service';
import { SaleItems } from '../../shared/models/SaleItems';
import { SaleItemsDetailComponent } from './sale-items-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sale-items-detail-page',
  standalone: true,
  imports: [CommonModule, SaleItemsDetailComponent],
  template: `
    <h1>Detalle de Item</h1>
    <app-sale-items-detail [saleItem]="saleItem"></app-sale-items-detail>
    <button (click)="goBack()">Back</button>
    <button (click)="onEdit()">Edit</button>
  `,
})
export class SaleItemsDetailPageComponent {
  saleItem: SaleItems | null = null;

  constructor(
    private service: SaleItemsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(o => (this.saleItem = o));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.saleItem) {
      this.router.navigate(['../', this.saleItem.id, 'edit'], { relativeTo: this.route });
    }
  }
}
