import { Component, Input } from '@angular/core';
import { SODiagnostic } from '../../shared/models/SODiagnostic';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-so-diagnostic-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './so-diagnostic-detail.component.html',
})
export class SODiagnosticDetailComponent {
  @Input() soDiagnostic: SODiagnostic | null = null;
}
