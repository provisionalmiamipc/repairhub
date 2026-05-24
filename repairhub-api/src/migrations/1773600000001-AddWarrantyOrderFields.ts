import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWarrantyOrderFields1773600000001 implements MigrationInterface {
  name = 'AddWarrantyOrderFields1773600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "isWarrantyOrder" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "originalServiceOrderId" integer`);
    await queryRunner.query(`ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "warrantyId" integer`);
    await queryRunner.query(`ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "warrantyDecision" character varying`);
    await queryRunner.query(`ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "warrantyDecisionReason" text`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_orders_warranty_order" ON "service_orders" ("isWarrantyOrder")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_orders_original_service_order" ON "service_orders" ("originalServiceOrderId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_orders_warranty" ON "service_orders" ("warrantyId")`);

    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_service_orders_original_service_order') THEN ALTER TABLE "service_orders" ADD CONSTRAINT "FK_service_orders_original_service_order" FOREIGN KEY ("originalServiceOrderId") REFERENCES "service_orders"(id) ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
    await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_service_orders_warranty') THEN ALTER TABLE "service_orders" ADD CONSTRAINT "FK_service_orders_warranty" FOREIGN KEY ("warrantyId") REFERENCES "service_order_warranties"(id) ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_orders" DROP CONSTRAINT IF EXISTS "FK_service_orders_warranty"`);
    await queryRunner.query(`ALTER TABLE "service_orders" DROP CONSTRAINT IF EXISTS "FK_service_orders_original_service_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_orders_warranty"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_orders_original_service_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_orders_warranty_order"`);
    await queryRunner.query(`ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "warrantyDecisionReason"`);
    await queryRunner.query(`ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "warrantyDecision"`);
    await queryRunner.query(`ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "warrantyId"`);
    await queryRunner.query(`ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "originalServiceOrderId"`);
    await queryRunner.query(`ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "isWarrantyOrder"`);
  }
}
