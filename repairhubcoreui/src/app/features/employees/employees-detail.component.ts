import { Component, Input } from '@angular/core';
import { Employees } from '../../shared/models/Employees';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeesService } from '../../shared/services/employees.service';


@Component({
  selector: 'app-employees-detail',
  standalone: true,
  templateUrl: './employees-detail.component.html',
  imports: [CommonModule,],
})
export class EmployeesDetailComponent {
  //@Input() employee!: Employees;
  employee: Employees | null = null;

  constructor(
    private employeeService: EmployeesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Aquí deberías obtener el empleado desde un servicio
    // Por simplicidad, se asume que ya está cargado o se pasa como input
    const employeeData = history.state.employee;
    if (employeeData) {
      this.employee = employeeData;
    } else {
      // Ejemplo: cargar desde un servicio
      const id = this.route.snapshot.paramMap.get('id');
      if(id)
      this.employeeService.getById(+id).subscribe(emp => this.employee = emp);
    }
  }

  goBack(): void {
    this.router.navigate(['/employees']); // Ajusta la ruta según tu app
  }

  editEmployee(): void {
    if (this.employee) {
      this.router.navigate(['../', this.employee.id, 'edit'], { relativeTo: this.route });
    }
  }
}
