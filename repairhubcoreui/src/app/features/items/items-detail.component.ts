import { Component, Input } from '@angular/core';
import { Items } from '../../shared/models/Items';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-items-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './items-detail.component.html',
})
export class ItemsDetailComponent {
  @Input() item: Items | null = null;
}
