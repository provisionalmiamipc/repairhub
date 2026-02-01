import { Component, Input } from '@angular/core';
import { Centers } from '../../shared/models/Centers';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-centers-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './centers-detail.component.html',
  styleUrls: ['./centers-detail.component.scss']
})
export class CentersDetailComponent {
  @Input() center: Centers | null = null;
}
