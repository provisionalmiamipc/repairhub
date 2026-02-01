// components/loading/loading.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loading$ | async" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    </div>
  `,
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent {
  private loadingService = inject(LoadingService);
  loading$ = this.loadingService.loading$;

  
}