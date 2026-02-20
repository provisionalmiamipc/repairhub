import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationIndexes1772000000000 implements MigrationInterface {
  name = 'AddNotificationIndexes1772000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_employeeId" ON "notifications" ("employeeId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_isBroadcast" ON "notifications" ("isBroadcast")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_status" ON "notifications" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_isBroadcast"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_employeeId"`);
  }
}
