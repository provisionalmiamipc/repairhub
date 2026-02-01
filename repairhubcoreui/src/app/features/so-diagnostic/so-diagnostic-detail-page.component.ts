import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SODiagnosticDetailComponent } from './so-diagnostic-detail.component';
import { SODiagnosticService } from '../../shared/services/so-diagnostic.service';
import { ActivatedRoute } from '@angular/router';
import { SODiagnostic } from '../../shared/models/SODiagnostic';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-so-diagnostic-detail-page',
  standalone: true,
  imports: [CommonModule, SODiagnosticDetailComponent],
  template: `
    <h1>Detalle de Diagnóstico</h1>
    <app-so-diagnostic-detail [soDiagnostic]="soDiagnostic"></app-so-diagnostic-detail>
  `,
  providers: [SODiagnosticService],
})
export class SODiagnosticDetailPageComponent {
  soDiagnostic: SODiagnostic | null = null;

  constructor(
    private soDiagnosticService: SODiagnosticService,
    private route: ActivatedRoute
  ) {
    this.route.paramMap
      .pipe(
        switchMap(params =>
          this.soDiagnosticService.getById(Number(params.get('id')))
        )
      )
      .subscribe(data => (this.soDiagnostic = data));
  }
}
