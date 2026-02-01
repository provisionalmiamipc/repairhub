import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { DeviceBrands } from '../../shared/models/DeviceBrands';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@coreui/angular';

@Component({
  selector: 'app-device-brands-list',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './device-brands-list.component.html',
})
export class DeviceBrandsListComponent {
  @Input() items: Observable<DeviceBrands[]> | null = null;
  @Output() selectDeviceBrand = new EventEmitter<DeviceBrands>();
  @Output() editDeviceBrand = new EventEmitter<DeviceBrands>();
  @Output() deleteDeviceBrand = new EventEmitter<DeviceBrands>();

  onSelect(item: DeviceBrands) {
    this.selectDeviceBrand.emit(item);
  }

  onEdit(item: DeviceBrands) {
    this.editDeviceBrand.emit(item);
  }

  onDelete(item: DeviceBrands) {
    this.deleteDeviceBrand.emit(item);
  }
}
