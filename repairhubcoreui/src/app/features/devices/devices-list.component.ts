import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Devices } from '../../shared/models/Devices';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@coreui/angular';

@Component({
  selector: 'app-devices-list',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './devices-list.component.html',
})
export class DevicesListComponent {
  @Input() items: Observable<Devices[]> | null = null;
  @Output() selectDevices = new EventEmitter<Devices>();
  @Output() editDevices = new EventEmitter<Devices>();
  @Output() deleteDevices = new EventEmitter<Devices>();

  onSelect(item: Devices) {
    this.selectDevices.emit(item);
  }

  onEdit(item: Devices) {
    this.editDevices.emit(item);
  }

  onDelete(item: Devices) {
    this.deleteDevices.emit(item);
  }
}
