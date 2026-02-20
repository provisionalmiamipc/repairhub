import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);
  private jwtService: JwtService;

  constructor(private configService: ConfigService) {
    this.jwtService = new JwtService({ secret: this.configService.getOrThrow<string>('JWT_EMPLOYEE_SECRET') } as any);
  }

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token = client?.handshake?.auth?.token;
    if (!token) {
      return false;
    }

    try {
      const payload: any = this.jwtService.verify(token);
      const employeeId = payload?.sub || payload?.employeeId || payload?.id;
      if (!employeeId) {
        this.logger.warn('WsJwtGuard: token has no employee id');
        return false;
      }
      (client as any).data = (client as any).data || {};
      (client as any).data.employeeId = Number(employeeId);
      return true;
    } catch (err: any) {
      this.logger.warn(`WsJwtGuard: token verification failed - ${err?.message || err}`);
      return false;
    }
  }
}
