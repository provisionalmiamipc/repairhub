import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateScheduledNotificationsTable1772000000002 implements MigrationInterface {
  name = 'CreateScheduledNotificationsTable1772000000002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "scheduled_notifications" (
      "id" serial primary key,
      "appointmentId" integer NOT NULL,
      "runAt" timestamp NOT NULL,
      "employeeId" integer,
      "centerId" integer,
      "storeId" integer,
      "status" varchar(20) NOT NULL DEFAULT 'pending',
      "payload" text,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_scheduled_notifications_runAt" ON "scheduled_notifications" ("runAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_scheduled_notifications_status" ON "scheduled_notifications" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_scheduled_notifications_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_scheduled_notifications_runAt"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "scheduled_notifications"`);
  }
}
