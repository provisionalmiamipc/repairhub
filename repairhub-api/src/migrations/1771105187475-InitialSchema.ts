import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1771105187475 implements MigrationInterface {
    name = 'InitialSchema1771105187475'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "ecustomerId" integer`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_29d0976c366441439c7ddd7c137') THEN ALTER TABLE "appointments" ADD CONSTRAINT "FK_29d0976c366441439c7ddd7c137" FOREIGN KEY ("ecustomerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_29d0976c366441439c7ddd7c137') THEN ALTER TABLE "appointments" DROP CONSTRAINT "FK_29d0976c366441439c7ddd7c137"; END IF; END $$;`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "ecustomerId"`);
    }

}
