import { IsString, IsOptional, IsUrl, IsDate, IsNotEmpty, IsEmail, Matches, MaxLength, IsInt } from 'class-validator';

export class CreateStoreDto {
	@IsString()
	@IsNotEmpty()	
	storeName: string;

	@IsOptional()
	@IsString()
	logo?: string;

	@IsString()
	@IsOptional()
	country?: string;

	@IsOptional()
	@IsString()
	address?: string;

	@IsOptional()
	@IsString()
	zipCode?: string;

	@IsOptional()
	@IsString()
	city?: string;

	@IsOptional()
	@IsString()
	state?: string;

	@IsOptional()
	@IsString()
	time_zone?: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@Matches(/^\+?[0-9\s\-]{7,20}$/, { message: 'El número de teléfono no es válido' })
	phoneNumber?: string;

	@IsOptional()
	@IsUrl()
	webSite?: string;

	@IsNotEmpty()
	centerId: number;
}
