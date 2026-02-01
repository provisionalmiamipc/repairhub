import { Component, Input } from '@angular/core';
import { Stores } from '../../shared/models/Stores';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stores-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stores-detail.component.html',
  styleUrls: ['./stores-detail.component.scss'],
})
export class StoresDetailComponent {
  @Input() store: Stores | null = null;
}
