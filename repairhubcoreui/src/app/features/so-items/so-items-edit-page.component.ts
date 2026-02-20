import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SOItemsService } from '../../shared/services/so-items.service';
import { SOItems } from '../../shared/models/SOItems';
import { SOItemsFormComponent } from './so-items-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-so-items-edit-page',
  standalone: true,
  imports: [CommonModule, SOItemsFormComponent],
  template: `
    <h1 *ngIf="!isNew">Edit Item</h1>
    <h1 *ngIf="isNew">New Item</h1>
    <app-so-items-form
      [soItem]="soItem"
      (save)="onSave($event)"
    ></app-so-items-form>
  `,
})
export class SOItemsEditPageComponent {
  soItem: SOItems | null = null;
  isNew = false;

  constructor(
    private service: SOItemsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new' || id === null) {
      this.isNew = true;
    } else {
      this.service.getById(+id).subscribe(s => (this.soItem = s));
    }
  }

  onSave(data: Partial<SOItems>) {
    if (this.isNew) {
      this.service.create(data).subscribe(() => this.router.navigate(['../'], { relativeTo: this.route }));
    } else if (this.soItem) {
      this.service.update(this.soItem.id, data).subscribe(() => this.router.navigate(['../../'], { relativeTo: this.route }));
    }
  }
}
