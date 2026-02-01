import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SONotes } from '../../shared/models/SONotes';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-so-notes-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './so-notes-list.component.html',
})
export class SONotesListComponent {
  @Input() soNotesList: SONotes[] = [];
  @Output() select = new EventEmitter<SONotes>();
  @Output() edit = new EventEmitter<SONotes>();
  @Output() delete = new EventEmitter<SONotes>();
}
