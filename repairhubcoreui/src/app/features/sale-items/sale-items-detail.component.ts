import { Component, Input } from '@angular/core';
import { SaleItems } from '../../shared/models/SaleItems';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sale-items-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sale-items-detail.component.html',
})
export class SaleItemsDetailComponent {
  @Input() saleItem: SaleItems | null = null;
}
