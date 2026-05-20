import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Injectable()
export class JwtEmployeeStrategy extends PassportStrategy(Strategy, 'jwt-employee') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_EMPLOYEE_SECRET'), // ← getOrThrow en lugar de get
    });
  }

  async validate(payload: any) {
    let employeeType = payload.employee_type;
    let centerId = payload.centerId;
    let storeId = payload.storeId;
    let isCenterAdmin = !!payload.isCenterAdmin;

    if (!employeeType || centerId === undefined) {
      const employee = await this.employeeRepository.findOne({
        where: { id: payload.sub },
        select: {
          id: true,
          employee_type: true,
          centerId: true,
          storeId: true,
          isCenterAdmin: true,
        },
      });

      employeeType = employee?.employee_type ?? employeeType;
      centerId = employee?.centerId ?? centerId;
      storeId = employee?.storeId ?? storeId;
      isCenterAdmin = employee?.isCenterAdmin ?? isCenterAdmin;
    }

    return { 
      sub: payload.sub,
      employeeId: payload.sub, 
      id: payload.sub,
      email: payload.employeeEmail || payload.email,
      type: 'employee',
      role: employeeType || 'employee',
      employee_type: employeeType,
      centerId,
      storeId,
      isCenterAdmin,
      pinVerified: !!payload.pinVerified,
    };
  }
}
