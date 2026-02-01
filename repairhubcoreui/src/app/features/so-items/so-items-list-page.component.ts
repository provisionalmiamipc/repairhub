import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SOItemsService } from '../../shared/services/so-items.service';
import { SOItems } from '../../shared/models/SOItems';
import { SOItemsListComponent } from './so-items-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-so-items-list-page',
  standalone: true,
  imports: [CommonModule, SOItemsListComponent],
  template: `
    <h1>Items de Orden de Servicio</h1>
    <button (click)="onCreate()">Nuevo Item</button>
    <app-so-items-list
      [soItems]="soItems"
      (select)="onSelect($event)"
      (edit)="onEdit($event)"
      (delete)="onDelete($event)"
    ></app-so-items-list>
  `,
})
export class SOItemsListPageComponent {
  soItems: SOItems[] = [];

  constructor(
    private service: SOItemsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.load();
  }

  load() {
    this.service.getAll().subscribe(soItems => (this.soItems = soItems));
  }

  onSelect(soItem: SOItems) {
    this.router.navigate(['./', soItem.id], { relativeTo: this.route });
  }

  onEdit(soItem: SOItems) {
    this.router.navigate(['./', soItem.id, 'edit'], { relativeTo: this.route });
  }

  onDelete(soItem: SOItems) {
    if (confirm('¿Eliminar este item?')) {
      this.service.delete(soItem.id).subscribe(() => this.load());
    }
  }

  onCreate() {
    this.router.navigate(['./new'], { relativeTo: this.route });
  }
}
