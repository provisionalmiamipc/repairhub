import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvoicePaymentFields1773700000001 implements MigrationInterface {
  name = 'AddInvoicePaymentFields1773700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paymentTypeId" integer`);
    await queryRunner.query(`ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paymentInstructions" text`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_invoices_paymentTypeId" ON "invoices" ("paymentTypeId")`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_invoices_payment_type') THEN
          ALTER TABLE "invoices"
          ADD CONSTRAINT "FK_invoices_payment_type"
          FOREIGN KEY ("paymentTypeId") REFERENCES "payment_types"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "FK_invoices_payment_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoices_paymentTypeId"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN IF EXISTS "paymentInstructions"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN IF EXISTS "paymentTypeId"`);
  }
}
