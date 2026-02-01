import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { RepairStatus } from '../../shared/models/RepairStatus';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@coreui/angular';

@Component({
  selector: 'app-repair-status-list',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './repair-status-list.component.html',
})
export class RepairStatusListComponent {
  @Input() items: Observable<RepairStatus[]> | null = null;
  @Output() selectRepairStatus = new EventEmitter<RepairStatus>();
  @Output() editRepairStatus = new EventEmitter<RepairStatus>();
  @Output() deleteRepairStatus = new EventEmitter<RepairStatus>();

  onSelect(item: RepairStatus): void {
    this.selectRepairStatus.emit(item);
  }

  onEdit(item: RepairStatus): void {
    this.editRepairStatus.emit(item);
  }

  onDelete(item: RepairStatus): void {
    this.deleteRepairStatus.emit(item);
  }
}
