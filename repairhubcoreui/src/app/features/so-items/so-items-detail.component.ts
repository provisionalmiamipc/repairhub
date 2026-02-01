import { Component, Input } from '@angular/core';
import { SOItems } from '../../shared/models/SOItems';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-so-items-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './so-items-detail.component.html',
})
export class SOItemsDetailComponent {
  @Input() soItem: SOItems | null = null;
}
