import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule} from '@nestjs/config';

// Services
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { ActivationToken } from './entities/activation-token.entity';
import { Employee } from '../employees/entities/employee.entity';
import { RefreshTokenService } from './refresh-token.service';

// Controllers
import { AuthController } from './auth.controller';

// Strategies
import { JwtUserStrategy } from './strategies/jwt-user.strategy';
import { JwtEmployeeStrategy } from './strategies/jwt-employee.strategy';

// Guards
import { JwtUserGuard } from './guards/jwt-user.guard';
import { JwtEmployeeGuard } from './guards/jwt-employee.guard';
import { JwtAnyGuard } from './guards/jwt-any.guard';

// Modules
import { UsersModule } from '../user/user.module';
import { EmployeesModule }from '../employees/employees.module';

@Module({
  imports: [
    // Módulos necesarios
    UsersModule,
    EmployeesModule,
    PassportModule,
    ConfigModule,
    TypeOrmModule.forFeature([RefreshToken, ActivationToken, Employee]),
        
  ],
  providers: [
    AuthService,
    RefreshTokenService,
    JwtUserStrategy,
    JwtEmployeeStrategy,
    JwtUserGuard,
    JwtEmployeeGuard,
    JwtAnyGuard,
  ],
  controllers: [AuthController],
  exports: [
    // Exportar para usar en otros módulos
    AuthService,
    JwtUserGuard,
    JwtEmployeeGuard,
    JwtAnyGuard,
  ],
})
export class AuthModule {}