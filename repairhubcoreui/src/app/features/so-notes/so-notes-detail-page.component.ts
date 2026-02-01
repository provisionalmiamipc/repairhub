import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SONotesDetailComponent } from './so-notes-detail.component';
import { SONotesService } from '../../shared/services/so-notes.service';
import { ActivatedRoute } from '@angular/router';
import { SONotes } from '../../shared/models/SONotes';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-so-notes-detail-page',
  standalone: true,
  imports: [CommonModule, SONotesDetailComponent],
  template: `
    <h1>Detalle de Nota</h1>
    <app-so-notes-detail [soNotes]="soNotes"></app-so-notes-detail>
  `,
  providers: [SONotesService],
})
export class SONotesDetailPageComponent {
  soNotes: SONotes | null = null;

  constructor(
    private soNotesService: SONotesService,
    private route: ActivatedRoute
  ) {
    this.route.paramMap
      .pipe(
        switchMap(params =>
          this.soNotesService.getById(Number(params.get('id')))
        )
      )
      .subscribe(data => (this.soNotes = data));
  }
}
