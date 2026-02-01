import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SONotesListComponent } from './so-notes-list.component';
import { SONotesService } from '../../shared/services/so-notes.service';
import { SONotes } from '../../shared/models/SONotes';

@Component({
  selector: 'app-so-notes-list-page',
  standalone: true,
  imports: [CommonModule, SONotesListComponent],
  template: `
    <h1>Notas</h1>
    <app-so-notes-list
      [soNotesList]="soNotesList"
      (select)="view($event)"
      (edit)="edit($event)"
      (delete)="delete($event)"
    ></app-so-notes-list>
    <button routerLink="/so-notes/new">Nueva Nota</button>
  `,
  providers: [SONotesService],
})
export class SONotesListPageComponent {
  soNotesList: SONotes[] = [];

  constructor(private soNotesService: SONotesService) {
    this.load();
  }

  load() {
    this.soNotesService.getAll().subscribe(data => (this.soNotesList = data));
  }

  view(soNotes: SONotes) {
    // Navegar a detalle
  }

  edit(soNotes: SONotes) {
    // Navegar a edición
  }

  delete(soNotes: SONotes) {
    if (confirm('¿Seguro que desea eliminar esta nota?')) {
      this.soNotesService.delete(soNotes.id).subscribe(() => this.load());
    }
  }
}
