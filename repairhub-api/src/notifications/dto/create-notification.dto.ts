
import {
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsNumber,
	IsBoolean,
	IsDate,
	IsObject,
} from 'class-validator';
import { NotificationType, NotificationPriority, NotificationStatus } from '../entities/notification.entity';

export class CreateNotificationDto {
	@IsNotEmpty()
	@IsString()
	title: string;

	@IsNotEmpty()
	@IsString()
	message: string;

	@IsEnum(NotificationType)
	@IsOptional()
	type?: NotificationType;

	@IsEnum(NotificationPriority)
	@IsOptional()
	priority?: NotificationPriority;

	@IsEnum(NotificationStatus)
	@IsOptional()
	status?: NotificationStatus;

	@IsOptional()
	@IsNumber()
	centerId?: number;

	@IsOptional()
	@IsNumber()
	storeId?: number;

	@IsOptional()
	@IsNumber()
	employeeId?: number;

	@IsOptional()
	@IsObject()
	metadata?: Record<string, any>;

	@IsOptional()
	@IsString()
	actionUrl?: string;

	@IsOptional()
	@IsString()
	icon?: string;

	@IsOptional()
	@IsBoolean()
	isBroadcast?: boolean;

	@IsOptional()
	@IsDate()
	expiresAt?: Date;

	@IsOptional()
	@IsDate()
	readAt?: Date;
}
