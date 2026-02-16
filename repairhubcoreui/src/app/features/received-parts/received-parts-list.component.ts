import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReceivedPartsService } from './received-parts.service';
import { ReceivedPart } from '../../shared/models/ReceivedPart';
import { ReceivedPartsFormComponent } from './received-parts-form.component';

@Component({
  selector: 'app-received-parts-list',
  standalone: true,
  imports: [CommonModule, ReceivedPartsFormComponent],
  template: `
  <div class="p-4">
    <h2>Received Parts</h2>
    <button class="btn btn-primary mb-2" (click)="openForm()">New</button>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>ID</th>
          <th>Accessory</th>
          <th>Service Order</th>
          <th>Center</th>
          <th>Store</th>
          <th>Created At</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let item of items">
          <td>{{item.id}}</td>
          <td>{{item.accessory}}</td>
          <td>{{item.serviceOrderId}}</td>
          <td>{{item.centerId}}</td>
          <td>{{item.storeId}}</td>
          <td>{{item.createdAt}}</td>
          <td>
            <button class="btn btn-sm btn-secondary me-1" (click)="edit(item)">Edit</button>
            <button class="btn btn-sm btn-danger" (click)="remove(item)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <app-received-parts-form *ngIf="showForm" [model]="editing" (saved)="onSaved($event)" (cancel)="closeForm()"></app-received-parts-form>
  </div>
  `,
  styles: []
})
export class ReceivedPartsListComponent implements OnInit {
  items: ReceivedPart[] = [];
  showForm = false;
  editing: ReceivedPart | null = null;

  constructor(private service: ReceivedPartsService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.service.getAll().subscribe(res => this.items = res || []);
  }

  openForm() {
    this.editing = null;
    this.showForm = true;
  }

  edit(item: ReceivedPart) {
    this.editing = { ...item };
    this.showForm = true;
  }

  remove(item: ReceivedPart) {
    if (!confirm('Delete received part?')) return;
    this.service.delete(item.id).subscribe(() => this.load());
  }

  closeForm() {
    this.showForm = false;
  }

  onSaved(saved: ReceivedPart) {
    this.showForm = false;
    this.load();
  }
}
