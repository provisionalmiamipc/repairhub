import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceOrderWarranties1773600000000 implements MigrationInterface {
  name = 'CreateServiceOrderWarranties1773600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service_orders"
      ADD COLUMN IF NOT EXISTS "warrantyDuration" integer NOT NULL DEFAULT 6
    `);
    await queryRunner.query(`
      ALTER TABLE "service_orders"
      ADD COLUMN IF NOT EXISTS "warrantyDurationUnit" character varying NOT NULL DEFAULT 'months'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_order_warranties" (
        "id" SERIAL NOT NULL,
        "centerId" integer NOT NULL,
        "storeId" integer NOT NULL,
        "serviceOrderId" integer NOT NULL,
        "customerId" integer NOT NULL,
        "deviceId" integer NOT NULL,
        "serial" character varying,
        "status" character varying NOT NULL DEFAULT 'active',
        "warrantyDuration" integer NOT NULL DEFAULT 6,
        "warrantyDurationUnit" character varying NOT NULL DEFAULT 'months',
        "warrantyStartDate" TIMESTAMP NOT NULL,
        "warrantyEndDate" TIMESTAMP NOT NULL,
        "coverageSummary" text,
        "warrantyVoidReason" text,
        "warrantyVoidNotes" text,
        "createdById" integer,
        "voidedById" integer,
        "voidedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_order_warranties_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_warranties_service_order" ON "service_order_warranties" ("serviceOrderId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_warranties_customer" ON "service_order_warranties" ("customerId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_warranties_status_end" ON "service_order_warranties" ("status", "warrantyEndDate")`);

    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_warranties_center') THEN ALTER TABLE "service_order_warranties" ADD CONSTRAINT "FK_warranties_center" FOREIGN KEY ("centerId") REFERENCES "centers"(id) ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_warranties_store') THEN ALTER TABLE "service_order_warranties" ADD CONSTRAINT "FK_warranties_store" FOREIGN KEY ("storeId") REFERENCES "stores"(id) ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_warranties_service_order') THEN ALTER TABLE "service_order_warranties" ADD CONSTRAINT "FK_warranties_service_order" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"(id) ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_warranties_customer') THEN ALTER TABLE "service_order_warranties" ADD CONSTRAINT "FK_warranties_customer" FOREIGN KEY ("customerId") REFERENCES "customers"(id) ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_warranties_device') THEN ALTER TABLE "service_order_warranties" ADD CONSTRAINT "FK_warranties_device" FOREIGN KEY ("deviceId") REFERENCES "devices"(id) ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_warranties_createdBy') THEN ALTER TABLE "service_order_warranties" ADD CONSTRAINT "FK_warranties_createdBy" FOREIGN KEY ("createdById") REFERENCES "employees"(id) ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_warranties_voidedBy') THEN ALTER TABLE "service_order_warranties" ADD CONSTRAINT "FK_warranties_voidedBy" FOREIGN KEY ("voidedById") REFERENCES "employees"(id) ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_order_warranties" DROP CONSTRAINT IF EXISTS "FK_warranties_voidedBy"`);
    await queryRunner.query(`ALTER TABLE "service_order_warranties" DROP CONSTRAINT IF EXISTS "FK_warranties_createdBy"`);
    await queryRunner.query(`ALTER TABLE "service_order_warranties" DROP CONSTRAINT IF EXISTS "FK_warranties_device"`);
    await queryRunner.query(`ALTER TABLE "service_order_warranties" DROP CONSTRAINT IF EXISTS "FK_warranties_customer"`);
    await queryRunner.query(`ALTER TABLE "service_order_warranties" DROP CONSTRAINT IF EXISTS "FK_warranties_service_order"`);
    await queryRunner.query(`ALTER TABLE "service_order_warranties" DROP CONSTRAINT IF EXISTS "FK_warranties_store"`);
    await queryRunner.query(`ALTER TABLE "service_order_warranties" DROP CONSTRAINT IF EXISTS "FK_warranties_center"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_warranties_status_end"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_warranties_customer"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_warranties_service_order"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_order_warranties"`);
    await queryRunner.query(`ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "warrantyDurationUnit"`);
    await queryRunner.query(`ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "warrantyDuration"`);
  }
}
