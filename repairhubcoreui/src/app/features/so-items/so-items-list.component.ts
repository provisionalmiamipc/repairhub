import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SOItems } from '../../shared/models/SOItems';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-so-items-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './so-items-list.component.html',
})
export class SOItemsListComponent {
  @Input() soItems: SOItems[] = [];
  @Output() select = new EventEmitter<SOItems>();
  @Output() edit = new EventEmitter<SOItems>();
  @Output() delete = new EventEmitter<SOItems>();
}
