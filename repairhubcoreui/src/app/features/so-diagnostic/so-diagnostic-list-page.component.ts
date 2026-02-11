import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SODiagnosticListComponent } from './so-diagnostic-list.component';
import { SODiagnosticService } from '../../shared/services/so-diagnostic.service';
import { SODiagnostic } from '../../shared/models/SODiagnostic';

@Component({
  selector: 'app-so-diagnostic-list-page',
  standalone: true,
  imports: [CommonModule, SODiagnosticListComponent],
  template: `
    <h1>Diagnostics</h1>
    <app-so-diagnostic-list
      [soDiagnostics]="soDiagnostics"
      (select)="view($event)"
      (edit)="edit($event)"
      (delete)="delete($event)"
    ></app-so-diagnostic-list>
    <button routerLink="/so-diagnostic/new">New Diagnostic</button>
  `,
  providers: [SODiagnosticService],
})
export class SODiagnosticListPageComponent {
  soDiagnostics: SODiagnostic[] = [];

  constructor(private soDiagnosticService: SODiagnosticService) {
    this.load();
  }

  load() {
    this.soDiagnosticService.getAll().subscribe(data => (this.soDiagnostics = data));
  }

  view(soDiagnostic: SODiagnostic) {
    // Navegar a detalle
  }

  edit(soDiagnostic: SODiagnostic) {
    // Navegar a edición
  }

  delete(soDiagnostic: SODiagnostic) {
    if (confirm('Are you sure you want to delete this diagnostic?')) {
      this.soDiagnosticService.delete(soDiagnostic.id).subscribe(() => this.load());
    }
  }
}
