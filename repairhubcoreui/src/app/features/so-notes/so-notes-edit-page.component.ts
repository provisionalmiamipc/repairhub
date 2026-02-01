import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SONotesFormComponent } from './so-notes-form.component';
import { SONotesService } from '../../shared/services/so-notes.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SONotes } from '../../shared/models/SONotes';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-so-notes-edit-page',
  standalone: true,
  imports: [CommonModule, SONotesFormComponent],
  template: `
    
    <app-so-notes-form
      [soNotes]="soNotes"
      (save)="onSave($event)"
    ></app-so-notes-form>
  `,
  providers: [SONotesService],
})
export class SONotesEditPageComponent {
  soNotes: SONotes | null = null;

  constructor(
    private soNotesService: SONotesService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.paramMap
      .pipe(
        switchMap(params =>
          this.soNotesService.getById(Number(params.get('id')))
        )
      )
      .subscribe(data => (this.soNotes = data));
  }

  onSave(data: Partial<SONotes>) {
    if (!this.soNotes) return;
    this.soNotesService.update(this.soNotes.id, data).subscribe(() => {
      this.router.navigate(['/so-notes']);
    });
  }
}
