import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomersService } from '../../shared/services/customers.service';
import { Customers } from '../../shared/models/Customers';
import { CommonModule } from '@angular/common';
import { CustomersFormComponent } from './customers-form.component';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { StoresService } from '../../shared/services/stores.service';
import { CentersService } from '../../shared/services/centers.service';

@Component({
  selector: 'app-customers-edit',
  standalone: true,
  //templateUrl: './customers-edit.component.html',
  imports: [CommonModule, CustomersFormComponent,],
  template: `
    <app-customers-form 
      [customer]="customer"
      [centers]="centers"
      [stores]="stores"
      (save)="onSave($event)"
      (cancel)="onCancel()">
    </app-customers-form >
  `
  
})
export class CustomersEditComponent implements OnInit {
  customer: Customers | null = null;
  loading = false;
  centers: Centers[] = [];
  stores: Stores[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customersService: CustomersService, private centersService: CentersService, 
      private storesService: StoresService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    
    if (idParam) {
      
      const id = Number(idParam);
      this.loading = true;
      this.customersService.getById(id).subscribe({
        next: (data) => {          
          this.customer = data;
          this.loading = false;
          
        },
        error: () => (this.loading = false),
      });
      
    } 
    

    this.centersService.getAll().subscribe((c) => (this.centers = c));
    this.storesService.getAll().subscribe((s) => (this.stores = s));

  }

  onSave(updated: Customers) {
    if (this.customer && this.customer.id && this.customer.id !== 0) {
      // Edición
      this.customersService.update(this.customer.id, updated).subscribe(() => {
        this.router.navigate(['/customers']);
      });
    } else {
      // Creación
      this.customersService.create(updated).subscribe(() => {
        this.router.navigate(['/customers']);
      });
    }
  }

  onCancel(): void {
    // Navegar atrás o limpiar
    window.history.back();
  }
}
