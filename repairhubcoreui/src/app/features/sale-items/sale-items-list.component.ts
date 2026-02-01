import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SaleItems } from '../../shared/models/SaleItems';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sale-items-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sale-items-list.component.html',
})
export class SaleItemsListComponent {
  @Input() saleItems: SaleItems[] = [];
  @Output() select = new EventEmitter<SaleItems>();
  @Output() edit = new EventEmitter<SaleItems>();
  @Output() delete = new EventEmitter<SaleItems>();
}
