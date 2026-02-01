import { Component, Input } from '@angular/core';
import { RepairStatus } from '../../shared/models/RepairStatus';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-repair-status-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './repair-status-detail.component.html',
})
export class RepairStatusDetailComponent {
  @Input() repairStatus: RepairStatus | null = null;
}
