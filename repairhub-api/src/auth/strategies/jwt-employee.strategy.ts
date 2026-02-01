import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtEmployeeStrategy extends PassportStrategy(Strategy, 'jwt-employee') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_EMPLOYEE_SECRET'), // ← getOrThrow en lugar de get
    });
  }

  async validate(payload: any) {
    return { 
      employeeId: payload.sub, 
      email: payload.email,
      type: 'employee'
    };
  }
}