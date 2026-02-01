import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Sales } from '../../shared/models/Sales';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-list.component.html',
})
export class SalesListComponent {
  @Input() sales: Sales[] = [];
  @Output() select = new EventEmitter<Sales>();
  @Output() edit = new EventEmitter<Sales>();
  @Output() delete = new EventEmitter<Sales>();
}
