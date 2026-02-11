import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { Store } from '../stores/entities/store.entity';
import { Center } from '../centers/entities/center.entity';
import { ActivationToken } from '../auth/entities/activation-token.entity';
import { Gender } from '../common/enums/gender.enum';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EmailService } from '../common/email.service';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(ActivationToken)
    private readonly activationTokenRepository: Repository<ActivationToken>,
    private readonly emailService: EmailService,
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

    // Generar PIN único por defecto
    const uniquePin = await this.generateUniquePin();

    // Si el DTO incluye un PIN, verificar que no exista ya y usarlo; si no, usar el generado
    let finalPin = uniquePin;
    if (createEmployeeDto.pin) {
      const existsPin = await this.employeeRepository.findOne({ where: { pin: createEmployeeDto.pin } });
      if (existsPin) {
        throw new ConflictException('PIN already in use');
      }
      finalPin = String(createEmployeeDto.pin);
    }

    // Hashear la contraseña temporal antes de guardar
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Validar que `phone` y `email` no existan para evitar error de clave única
    if (createEmployeeDto.phone) {
      const existsPhone = await this.employeeRepository.findOne({ where: { phone: createEmployeeDto.phone } });
      if (existsPhone) {
        throw new ConflictException('Phone number already in use');
      }
    }

    if (createEmployeeDto.email) {
      const existsEmail = await this.employeeRepository.findOne({ where: { email: createEmployeeDto.email } });
      if (existsEmail) {
        throw new ConflictException('Email already in use');
      }
    }

    // Validate centerId/storeId existence and relations
    let validCenterId: number | undefined = undefined;
    let validStoreId: number | undefined = undefined;

    if (createEmployeeDto.centerId !== undefined && createEmployeeDto.centerId !== null) {
      const cId = Number(createEmployeeDto.centerId);
      const center = await this.employeeRepository.manager.findOne(Center, { where: { id: cId } });
      if (!center) {
        throw new NotFoundException(`Center with id ${cId} not found`);
      }
      validCenterId = cId;
    }

    if (createEmployeeDto.storeId !== undefined && createEmployeeDto.storeId !== null) {
      const sId = Number(createEmployeeDto.storeId);
      const store = await this.employeeRepository.manager.findOne(Store, { where: { id: sId } });
      if (!store) {
        throw new NotFoundException(`Store with id ${sId} not found`);
      }
      // If center provided, ensure store belongs to that center
      if (validCenterId !== undefined && store.centerId !== validCenterId) {
        throw new ConflictException('Store does not belong to the provided center');
      }
      validStoreId = sId;
    }

    const employeeData: any = {
      ...createEmployeeDto,
      gender: createEmployeeDto.gender === 'Male' ? Gender.MALE : Gender.FEMALE,
      employeeCode,
      password: hashedPassword,
      pin: finalPin,
      pinTimeout: createEmployeeDto.pinTimeout ?? 0,
      isCenterAdmin: createEmployeeDto.isCenterAdmin ?? false,
    };

    if (validCenterId !== undefined) employeeData.centerId = validCenterId;
    else delete employeeData.centerId;
    if (validStoreId !== undefined) employeeData.storeId = validStoreId;
    else delete employeeData.storeId;

    const employee = this.employeeRepository.create(employeeData);
    let savedEmployee: Employee;
    try {
      const result = await this.employeeRepository.save(employee as any);
      // TypeORM may return an entity or an array when saving; normalize to single Employee
      if (Array.isArray(result)) {
        savedEmployee = result[0] as Employee;
      } else {
        savedEmployee = result as Employee;
      }
    } catch (err: any) {
      // Mapear error de clave única de Postgres a ConflictException para una respuesta más clara
      if (err?.code === '23505') {
        throw new ConflictException('Duplicate record in database: phone or email already exists');
      }
      throw err;
    }
    
    // Generar token de activación (un solo uso)
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Ejecutar creación de token y envío de email en segundo plano para no bloquear la respuesta
    (async () => {
      try {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHashLocal = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAtLocal = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        try {
          await this.activationTokenRepository.save({
            employee: savedEmployee,
            tokenHash: tokenHashLocal,
            expiresAt: expiresAtLocal,
          } as any);
        } catch (err) {
          console.error('Failed to save activation token (background):', err?.message || err);
        }

        const activationLink = `${process.env.APP_URL || 'http://localhost:4200'}/activate?token=${token}`;

        try {
          await this.emailService.sendWelcomeEmail({
            to: savedEmployee.email,
            fullName: `${savedEmployee.firstName ?? ''} ${savedEmployee.lastName ?? ''}`.trim(),
            employeeCode,
            pin: finalPin,
            tempPassword: tempPassword,
            // @ts-ignore - allow passing activationLink to template
            activationLink,
          } as any);
        } catch (err) {
          console.error('Failed to send welcome email (background):', err?.message || err);
        }
      } catch (bgErr) {
        console.error('Background activation/email flow failed:', bgErr?.message || bgErr);
      }
    })();

    return {
      employee: savedEmployee,
      tempPassword: tempPassword // ← Mostrar al admin en respuesta por compatibilidad
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

    throw new ConflictException('Could not generate a unique PIN after several attempts');
  }

  // Nota: el envío de correo lo delegamos en `EmailService`.

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
