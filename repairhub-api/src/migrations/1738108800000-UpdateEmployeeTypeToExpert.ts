import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEmployeeTypeToExpert1738108800000 implements MigrationInterface {
    name = 'UpdateEmployeeTypeToExpert1738108800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Primero eliminar el default
        await queryRunner.query(`
            ALTER TABLE "employees" 
            ALTER COLUMN "employee_type" DROP DEFAULT
        `);
        
        // Cambiar el tipo de enum
        await queryRunner.query(`
            ALTER TYPE "employees_employee_type_enum" 
            RENAME TO "employees_employee_type_enum_old"
        `);
        
        await queryRunner.query(`
            CREATE TYPE "employees_employee_type_enum" AS ENUM('Expert', 'Accountant', 'AdminStore')
        `);
        
        // Actualizar todos los registros de 'Employee' a 'Expert'
        await queryRunner.query(`
            ALTER TABLE "employees" 
            ALTER COLUMN "employee_type" TYPE "employees_employee_type_enum" 
            USING CASE 
                WHEN "employee_type"::text = 'Employee' THEN 'Expert'::"employees_employee_type_enum"
                ELSE "employee_type"::text::"employees_employee_type_enum"
            END
        `);
        
        // Eliminar el enum antiguo
        await queryRunner.query(`DROP TYPE "employees_employee_type_enum_old"`);
        
        // Establecer el nuevo default
        await queryRunner.query(`
            ALTER TABLE "employees" 
            ALTER COLUMN "employee_type" SET DEFAULT 'Expert'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar el default
        await queryRunner.query(`
            ALTER TABLE "employees" 
            ALTER COLUMN "employee_type" DROP DEFAULT
        `);
        
        // Revertir cambios
        await queryRunner.query(`
            ALTER TYPE "employees_employee_type_enum" 
            RENAME TO "employees_employee_type_enum_new"
        `);
        
        await queryRunner.query(`
            CREATE TYPE "employees_employee_type_enum" AS ENUM('Employee', 'Accountant', 'AdminStore')
        `);
        
        await queryRunner.query(`
            ALTER TABLE "employees" 
            ALTER COLUMN "employee_type" TYPE "employees_employee_type_enum" 
            USING CASE 
                WHEN "employee_type"::text = 'Expert' THEN 'Employee'::"employees_employee_type_enum"
                ELSE "employee_type"::text::"employees_employee_type_enum"
            END
        `);
        
        await queryRunner.query(`DROP TYPE "employees_employee_type_enum_new"`);
        
        await queryRunner.query(`
            ALTER TABLE "employees" 
            ALTER COLUMN "employee_type" SET DEFAULT 'Employee'
        `);
    }
}
