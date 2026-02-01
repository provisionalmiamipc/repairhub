import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { Gender } from '../common/enums/gender.enum';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    // Obtener el último employeeCode
    const lastEmployee = await this.employeeRepository.createQueryBuilder('em')
      .orderBy('em.employeeCode', 'DESC')
      .where('em.employeeCode LIKE :prefix', { prefix: 'EM%' })
      .getOne();

    let nextNumber = 1;
    if (lastEmployee && lastEmployee.employeeCode) {
      const match = lastEmployee.employeeCode.match(/EM(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const employeeCode = `EM${nextNumber.toString().padStart(5, '0')}`;

    // Generar password temporal
    const tempPassword = this.generateTempPassword();
    
    // Generar PIN único
    const uniquePin = await this.generateUniquePin();

    const employee = this.employeeRepository.create({
      ...createEmployeeDto,
      gender: createEmployeeDto.gender === 'Male' ? Gender.MALE : Gender.FEMALE,
      employeeCode,
      password: tempPassword,
      pin: uniquePin,
      pinTimeout: 0,
      isCenterAdmin: false
    });
    const savedEmployee = await this.employeeRepository.save(employee);
    
    // Enviar email con credenciales (incluyendo PIN)
    this.sendWelcomeEmail(savedEmployee, tempPassword, uniquePin);
    
    return {
      employee: savedEmployee,
      tempPassword: tempPassword // ← Password sin hash para mostrar en frontend
    };
  }

  private generateTempPassword(): string {
    const randomPart = crypto.randomBytes(6).toString('hex');
    return `Temp${randomPart}!`;
  }

  private async generateUniquePin(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Generar PIN de 4 dígitos (0000-9999)
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Verificar si ya existe
      const existing = await this.employeeRepository.findOne({
        where: { pin }
      });

      if (!existing) {
        return pin; // PIN único encontrado
      }

      attempts++;
    }

    throw new ConflictException('No se pudo generar un PIN único después de varios intentos');
  }

  private async sendWelcomeEmail(employee: Employee, tempPassword: string, pin: string): Promise<void> {
    try {
      // Tu lógica de envío de email
      console.log('📧 Credenciales para:', employee.email);
      console.log('🔑 Password temporal:', tempPassword);
      console.log('🔢 PIN único:', pin);
      console.log('👤 Código de empleado:', employee.employeeCode);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  // Método para buscar por PIN (útil para login)
  async findByPin(pin: string): Promise<Employee | null> {
    return this.employeeRepository.findOne({ 
      where: { pin } 
    });
  }

  async findAll() {
    return this.employeeRepository.find({ relations: ['center', 'store', 'appointments', ] });
  }

  async findOne(id: number) {
    return this.employeeRepository.findOne({ where: { id }, relations: ['center', 'store', 'appointments', ] });
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return await this.employeeRepository.findOne({ where: { email } });
  }

  async validatePassword(employee: Employee, password: string): Promise<boolean> {
    if (!employee?.password) return false;

    // Si no está hasheada, comparar en claro y migrar a hash
    if (!employee.password.startsWith('$2b$')) {
      const isMatch = employee.password === password;
      if (isMatch) {
        const hashedPassword = await bcrypt.hash(password, 12);
        await this.employeeRepository.update(employee.id, { password: hashedPassword });
      }
      return isMatch;
    }

    return employee.validatePassword(password);
  }

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = await this.findOne(id);
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const updateData: any = { ...updateEmployeeDto };

    // Normalizar gender si viene en el DTO
    if (updateData.gender) {
      updateData.gender = updateData.gender === 'Male' ? Gender.MALE : Gender.FEMALE;
    }

    // Si viene password, encriptarlo manualmente
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    if (updateData.centerId !== undefined) {
      updateData.centerId = Number(updateData.centerId);
    }
    if (updateData.storeId !== undefined) {
      updateData.storeId = Number(updateData.storeId);
    }

    delete updateData.center;
    delete updateData.store;

    await this.employeeRepository.update(id, updateData);
    return this.findOne(id);
  }

  async updatePassword(employeeId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await this.employeeRepository.update(employeeId, {
      password: hashedPassword
    });
  }

  async remove(id: number) {
    await this.employeeRepository.delete(id);
    return { deleted: true };
  }
}
