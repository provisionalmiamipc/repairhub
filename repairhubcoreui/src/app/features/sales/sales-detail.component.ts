import { Component, Input } from '@angular/core';
import { Sales } from '../../shared/models/Sales';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sales-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-detail.component.html',
})
export class SalesDetailComponent {
  @Input() sale: Sales | null = null;
}
