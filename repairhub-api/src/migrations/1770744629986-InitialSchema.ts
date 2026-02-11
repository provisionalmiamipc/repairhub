import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1770744629986 implements MigrationInterface {
    name = 'InitialSchema1770744629986'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" ADD "assignedTechId" integer`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_f6ab7da863d8a6875c94558e39f" FOREIGN KEY ("assignedTechId") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_f6ab7da863d8a6875c94558e39f"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "assignedTechId"`);
    }

}
