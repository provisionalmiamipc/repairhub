import { IsString, IsOptional, IsEmail, IsEnum, IsBoolean, IsInt, Min, Max, Matches, IsNotEmpty } from 'class-validator';

export class CreateCustomerDto {
	@IsString()
	@IsNotEmpty()
	firstName: string;

	@IsString()
	@IsNotEmpty()
	lastName: string;

	@IsOptional()
	@Matches(/^\+?[0-9\s\-]{7,20}$/, { message: 'El número de teléfono no es válido' })
	phone?: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsString()
	city?: string;

	@IsEnum(['Male', 'Female'])
	gender: 'Male' | 'Female';

	@IsOptional()
	@IsString()
	extraInfo?: string;

	@IsBoolean()
	b2b: boolean = false;

	@IsInt()
	@Min(0)
	@Max(100)
	discount: number;

	@IsInt()
	centerId: number;

	@IsInt()
	storeId: number;

}
