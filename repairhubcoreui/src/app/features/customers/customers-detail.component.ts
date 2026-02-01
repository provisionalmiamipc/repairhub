import { Component, Input } from '@angular/core';
import { Customers } from '../../shared/models/Customers';
import { CommonModule } from '@angular/common';
import { CardComponent, CardBodyComponent, CardHeaderComponent, BadgeModule } from '@coreui/angular';
import { CustomersService } from '../../shared/services/customers.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-customers-detail',
  standalone: true,
  templateUrl: './customers-detail.component.html',
  imports: [CommonModule],
})
export class CustomersDetailComponent {
  //@Input() customer!: Customers;
  customer: Customers | null = null;

  constructor(
    private customerService: CustomersService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {

    // Ejemplo: cargar desde un servicio
    const id = this.route.snapshot.paramMap.get('id');
    if (id)
      this.customerService.getById(+id).subscribe(cus => this.customer = cus);

  }

  editCustomer() {
    // Navigate to edit page or open edit modal
    if (this.customer)
      this.router.navigate(['../', this.customer?.id, 'edit'], { relativeTo: this.route });
  }

  close(): void {
    // Navegar atrás o limpiar
    window.history.back();
  }
}
