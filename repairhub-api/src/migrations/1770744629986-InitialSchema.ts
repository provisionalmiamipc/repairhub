import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1770744629986 implements MigrationInterface {
    name = 'InitialSchema1770744629986'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "assignedTechId" integer`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_f6ab7da863d8a6875c94558e39f') THEN ALTER TABLE "appointments" ADD CONSTRAINT "FK_f6ab7da863d8a6875c94558e39f" FOREIGN KEY ("assignedTechId") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_f6ab7da863d8a6875c94558e39f') THEN ALTER TABLE "appointments" DROP CONSTRAINT "FK_f6ab7da863d8a6875c94558e39f"; END IF; END $$;`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "assignedTechId"`);
    }

}
