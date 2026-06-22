import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBinToServiceOrders1774100000000 implements MigrationInterface {
  name = 'AddBinToServiceOrders1774100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "bin" character varying DEFAULT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "bin"`);
  }
}
