
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { ScheduledNotificationsService } from './scheduled-notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { EmailService } from '../common/email.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { UserNotification } from './entities/user-notification.entity';
import { ScheduledNotification } from './entities/scheduled-notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Module({
    imports: [TypeOrmModule.forFeature([Notification, UserNotification, ScheduledNotification])],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationsGateway, ScheduledNotificationsService, NotificationsScheduler, EmailService],
    exports: [NotificationsService, ScheduledNotificationsService],
})
export class NotificationsModule {}
