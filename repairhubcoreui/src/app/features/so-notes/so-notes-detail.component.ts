import { Component, Input } from '@angular/core';
import { SONotes } from '../../shared/models/SONotes';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-so-notes-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './so-notes-detail.component.html',
})
export class SONotesDetailComponent {
  @Input() soNotes: SONotes | null = null;
}
