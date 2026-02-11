import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CentersService } from '../../shared/services/centers.service';
import { Centers } from '../../shared/models/Centers';
import { CentersDetailComponent } from './centers-detail.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-centers-detail-page',
  standalone: true,
  imports: [CommonModule, CentersDetailComponent],
  template: `
    <div class="detail-page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <button class="btn-back" (click)="goBack()" title="Back">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="header-title">
            <h1>Detalle de Centro<span *ngIf="center"> {{ center.centerCode }}</span></h1>
            <p class="header-subtitle" *ngIf="center">{{ center.centerName }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-action-edit" (click)="onEdit()" [disabled]="!center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar Centro
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="page-content">
        <app-centers-detail [center]="center"></app-centers-detail>
      </div>
    </div>
  `,
  styles: [`
    .detail-page-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid var(--border-color);
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
      min-width: 250px;
    }

    .btn-back {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: transparent;
      border: 2px solid var(--border-color);
      border-radius: 12px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      svg {
        width: 20px;
        height: 20px;
      }
      
      &:hover {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: white;
        transform: translateX(-4px);
      }
    }

    .header-title {
      flex: 1;
      
      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
        line-height: 1.2;
      }
      
      .header-subtitle {
        font-size: 0.95rem;
        color: var(--text-secondary);
        margin: 0.25rem 0 0;
      }
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-action-edit {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, var(--primary-color) 0%, #4338ca 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
      
      svg {
        width: 18px;
        height: 18px;
      }
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(var(--primary-rgb), 0.4);
      }
      
      &:active:not(:disabled) {
        transform: translateY(0);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .page-content {
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .detail-page-container {
        padding: 1rem;
      }
      
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .header-content {
        width: 100%;
      }
      
      .header-actions {
        width: 100%;
        
        .btn-action-edit {
          width: 100%;
        }
      }
      
      .header-title h1 {
        font-size: 1.5rem;
      }
    }
  `],
})
export class CentersDetailPageComponent {
  center: Centers | null = null;

  constructor(
    private service: CentersService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getById(+id).subscribe(c => (this.center = c));
    }
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onEdit() {
    if (this.center) {
      this.router.navigate(['../', this.center.id, 'edit'], { relativeTo: this.route });
    }
  }
}
