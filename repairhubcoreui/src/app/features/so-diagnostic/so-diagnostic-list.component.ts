import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SODiagnostic } from '../../shared/models/SODiagnostic';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-so-diagnostic-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './so-diagnostic-list.component.html',
})
export class SODiagnosticListComponent {
  @Input() soDiagnostics: SODiagnostic[] = [];
  @Output() select = new EventEmitter<SODiagnostic>();
  @Output() edit = new EventEmitter<SODiagnostic>();
  @Output() delete = new EventEmitter<SODiagnostic>();
}
