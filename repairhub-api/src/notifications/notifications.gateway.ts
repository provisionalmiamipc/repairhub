import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: Function) => {
      const nodeEnv = process.env.NODE_ENV || 'development';
      const envList = process.env.CORS_ORIGINS || '';
      const allowedOrigins = envList
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => s.replace(/\/$/, ''));

      const originNormalized = origin ? origin.replace(/\/$/, '') : origin;
      if (!origin) return callback(null, true);
      if (originNormalized && originNormalized.includes('.vercel.app')) return callback(null, true);
      if (allowedOrigins.indexOf(originNormalized) !== -1) return callback(null, true);
      if (nodeEnv === 'development') {
        
        return callback(null, true);
      }
      return callback(new Error('No permitido por CORS'), false);
    }
  }
})
@Injectable()
@UseGuards(WsJwtGuard)
export class NotificationsGateway {
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private configService: ConfigService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const emp = (client as any).data?.employeeId || (client.handshake && (client.handshake as any).auth && (client.handshake as any).auth.employeeId);
    if (emp) {
      client.join(`employee_${emp}`);
    }
  }

  handleDisconnect(client: Socket) {
    // connection closed
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() _payload: { employeeId?: number }, @ConnectedSocket() client: Socket) {
    const emp = (client as any).data?.employeeId;
    if (emp) {
      client.join(`employee_${emp}`);
      // ensured join
    } else {
      this.logger.warn(`Socket ${client.id} attempted join without authenticated employee id`);
    }
  }

  emitToEmployee(employeeId: number, event: string, payload: any) {
    this.server.to(`employee_${employeeId}`).emit(event, payload);
  }

  emitBroadcast(event: string, payload: any) {
    this.server.emit(event, payload);
  }
}