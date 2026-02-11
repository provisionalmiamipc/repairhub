import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  async create(@Body() createEmployeeDto: CreateEmployeeDto) {
    //return this.employeesService.create(createEmployeeDto);
    const result = await this.employeesService.create(createEmployeeDto);
    try {
      // Serialize to plain object to avoid circular/proxy issues
      const plainEmployee = JSON.parse(JSON.stringify(result.employee));
      return {
        ...plainEmployee,
        tempPassword: result.tempPassword,
        pin: plainEmployee.pin
      };
    } catch (err) {
      console.error('Error serializing employee response:', err?.message || err);
      // Fallback: return minimal payload
      return {
        id: result.employee.id,
        employeeCode: result.employee.employeeCode,
        firstName: result.employee.firstName,
        lastName: result.employee.lastName,
        email: result.employee.email,
        pin: result.employee.pin,
        tempPassword: result.tempPassword
      };
    }
  }

  @Get()
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.employeesService.remove(id);
  }
}
