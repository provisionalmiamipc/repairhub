
import {
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsNumber,
	IsBoolean,
	IsDate,
	IsObject,
	MaxLength,
	IsUrl,
} from 'class-validator';
import { NotificationType, NotificationPriority, NotificationStatus } from '../entities/notification.entity';

export class CreateNotificationDto {
	@IsNotEmpty()
	@IsString()
	@MaxLength(255)
	title: string;

	@IsNotEmpty()
	@IsString()
	@MaxLength(2000)
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
	@IsUrl()
	@IsOptional()
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
