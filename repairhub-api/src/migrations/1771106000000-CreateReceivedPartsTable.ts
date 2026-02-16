import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReceivedPartsTable1771106000000 implements MigrationInterface {
  name = 'CreateReceivedPartsTable1771106000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "received_parts" (
      "id" SERIAL PRIMARY KEY,
      "centerId" integer NOT NULL,
      "storeId" integer NOT NULL,
      "serviceOrderId" integer NOT NULL,
      "accessory" text NOT NULL,
      "observations" text,
      "createdById" integer,
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_received_parts_center') THEN ALTER TABLE "received_parts" ADD CONSTRAINT "FK_received_parts_center" FOREIGN KEY ("centerId") REFERENCES "centers"(id) ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_received_parts_store') THEN ALTER TABLE "received_parts" ADD CONSTRAINT "FK_received_parts_store" FOREIGN KEY ("storeId") REFERENCES "stores"(id) ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_received_parts_service_order') THEN ALTER TABLE "received_parts" ADD CONSTRAINT "FK_received_parts_service_order" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"(id) ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_received_parts_createdBy') THEN ALTER TABLE "received_parts" ADD CONSTRAINT "FK_received_parts_createdBy" FOREIGN KEY ("createdById") REFERENCES "employees"(id) ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "received_parts" DROP CONSTRAINT IF EXISTS "FK_received_parts_createdBy"`);
    await queryRunner.query(`ALTER TABLE "received_parts" DROP CONSTRAINT IF EXISTS "FK_received_parts_service_order"`);
    await queryRunner.query(`ALTER TABLE "received_parts" DROP CONSTRAINT IF EXISTS "FK_received_parts_store"`);
    await queryRunner.query(`ALTER TABLE "received_parts" DROP CONSTRAINT IF EXISTS "FK_received_parts_center"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "received_parts"`);
  }
}
