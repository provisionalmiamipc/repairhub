import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { TrackServiceOrderDto } from './dto/track-service-order.dto';
import { PublicOrderStatusService } from './public-order-status.service';

@Public()
@Controller('public/service-orders')
export class PublicOrderStatusController {
  constructor(private readonly publicOrderStatusService: PublicOrderStatusService) {}

  @Post('status')
  track(@Body() dto: TrackServiceOrderDto, @Req() req: Request) {
    return this.publicOrderStatusService.track(dto, this.getClientIp(req));
  }

  private getClientIp(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (Array.isArray(forwardedFor)) return forwardedFor[0] || 'unknown';
    if (typeof forwardedFor === 'string') return forwardedFor.split(',')[0]?.trim() || 'unknown';
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
