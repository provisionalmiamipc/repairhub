import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserNotificationsTable1772000000001 implements MigrationInterface {
  name = 'CreateUserNotificationsTable1772000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "user_notifications" (
      "id" serial primary key,
      "notificationId" integer NOT NULL,
      "employeeId" integer NOT NULL,
      "status" varchar(10) NOT NULL DEFAULT 'unread',
      "readAt" timestamp,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_notifications_notificationId" ON "user_notifications" ("notificationId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_notifications_employeeId" ON "user_notifications" ("employeeId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_notifications_employeeId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_notifications_notificationId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_notifications"`);
  }
}
