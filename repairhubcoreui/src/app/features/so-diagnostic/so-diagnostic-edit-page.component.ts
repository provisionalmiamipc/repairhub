import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SODiagnosticFormComponent } from './so-diagnostic-form.component';
import { SODiagnosticService } from '../../shared/services/so-diagnostic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SODiagnostic } from '../../shared/models/SODiagnostic';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-so-diagnostic-edit-page',
  standalone: true,
  imports: [CommonModule, SODiagnosticFormComponent],
  template: `
    <h1>Editar Diagnóstico</h1>
    <app-so-diagnostic-form
      [soDiagnostic]="soDiagnostic"
      (save)="onSave($event)"
    ></app-so-diagnostic-form>
  `,
  providers: [SODiagnosticService],
})
export class SODiagnosticEditPageComponent {
  soDiagnostic: SODiagnostic | null = null;

  constructor(
    private soDiagnosticService: SODiagnosticService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.paramMap
      .pipe(
        switchMap(params =>
          this.soDiagnosticService.getById(Number(params.get('id')))
        )
      )
      .subscribe(data => (this.soDiagnostic = data));
  }

  onSave(data: Partial<SODiagnostic>) {
    if (!this.soDiagnostic) return;
    this.soDiagnosticService.update(this.soDiagnostic.id, data).subscribe(() => {
      this.router.navigate(['/so-diagnostic']);
    });
  }
}
