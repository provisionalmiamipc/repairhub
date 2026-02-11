import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1770744181117 implements MigrationInterface {
    name = 'InitialSchema1770744181117'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_orders" ADD "estimated" character varying`);
        await queryRunner.query(`ALTER TABLE "service_orders" ALTER COLUMN "estimated" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_orders" ALTER COLUMN "estimated" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "service_orders" DROP COLUMN "estimated"`);
    }

}
