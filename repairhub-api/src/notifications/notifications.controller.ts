import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException, Query, BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtEmployeeGuard } from 'src/auth/guards/jwt-employee.guard';
import { JwtAnyGuard } from 'src/auth/guards/jwt-any.guard';
import { UseGuards as UseGuardsMethod } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAnyGuard)
@ApiBearerAuth('JWT-Auth')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto, @Req() req: any) {
    // Only admins can create broadcast notifications
    if (createNotificationDto.isBroadcast) {
      const role = req.user?.role || req.user?.type || null;
      // allow application-level super-user type ('user') or employee role 'admin'
      if (role !== 'admin' && role !== 'user') {
        throw new ForbiddenException('Only admins can create broadcast notifications');
      }
    }
    return this.notificationsService.createAndEmit(createNotificationDto);
  }

  @Get()
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get('me')
  async myNotifications(@Req() req: any, @Query() query: any) {
    const employeeId = req.user?.employeeId || req.user?.sub || req.user?.id;
    if (!employeeId || Number.isNaN(Number(employeeId))) {
      throw new BadRequestException('Employee id required');
    }

    const limit = query?.limit ? Number(query.limit) : undefined;
    const offset = query?.offset ? Number(query.offset) : undefined;

    return this.notificationsService.findForEmployee(Number(employeeId), { limit, offset });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto, @Req() req: any) {
    // If the update is only marking as read, route to markRead so broadcasts are handled per-user
    if (updateNotificationDto && (updateNotificationDto as any).status === 'read') {
      const employeeId = req.user?.employeeId || req.user?.sub || req.user?.id;
      const role = req.user?.role || req.user?.type || null;
      return this.notificationsService.markRead(Number(id), { employeeId: Number(employeeId), role });
    }
    return this.notificationsService.update(+id, updateNotificationDto);
  }

  
  @Delete(':id')
  @UseGuardsMethod(RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(+id);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: number, @Req() req: any) {
    const employeeId = req.user?.employeeId || req.user?.sub || req.user?.id;
    const role = req.user?.role || req.user?.type || null;
    return this.notificationsService.markRead(Number(id), { employeeId: Number(employeeId), role });
  }

  
  
}
