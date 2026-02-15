import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1770744053644 implements MigrationInterface {
    name = 'InitialSchema1770744053644'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "estimated" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_orders" DROP COLUMN "estimated"`);
    }

}
