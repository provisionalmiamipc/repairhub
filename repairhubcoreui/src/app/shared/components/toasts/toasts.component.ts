import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toasts.component.html'
})
export class ToastsComponent {
  toasts$: Observable<any>;

  constructor(private toastService: ToastService) {
    this.toasts$ = this.toastService.getToasts();
  }

  dismiss(id: number) {
    this.toastService.dismiss(id);
  }
}
