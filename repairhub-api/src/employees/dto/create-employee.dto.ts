import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, IsInt, Min, Length, Matches } from 'class-validator';

export class CreateEmployeeDto {
	@IsInt()
	storeId?: number;

	@IsInt()
	centerId: number;

	@IsString()
	@IsNotEmpty()
	firstName: string;

	@IsString()
	@IsNotEmpty()
	lastName: string;

	@IsEnum(['Male', 'Female'])
	gender: 'Male' | 'Female';

	@IsString()
	@IsNotEmpty()
	@Matches(/^\+?[0-9\s\-]{7,20}$/, { message: 'El número de teléfono no es válido' })
	phone: string;

	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsOptional()
	@IsString()
	city?: string;

	@IsEnum(['Expert', 'Accountant', 'AdminStore'])
	employee_type: 'Expert' | 'Accountant' | 'AdminStore';

	@IsOptional()
	@IsString()
	jobTitle?: string;

	
	@IsOptional()
	@IsString()
	avatar?: string;

	@IsInt()
	@Min(0)
	pinTimeout: number;

	@IsString()
	@Length(4, 6)
	pin: string;

	@IsString()	
	@IsOptional()	
	password: string;

	@IsOptional()
	isCenterAdmin?: boolean;

	@IsOptional()
	isActive: boolean;
}
