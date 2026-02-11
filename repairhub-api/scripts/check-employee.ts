import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { EmployeesService } from '../src/employees/employees.service';
import { RefreshTokenService } from '../src/auth/refresh-token.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const email = process.env.EMAIL_TO_CHECK;
  if (!email) {
    console.error('Set EMAIL_TO_CHECK env var');
    process.exit(1);
  }

  const employeesService = app.get(EmployeesService);
  const refreshTokenService = app.get(RefreshTokenService);
  const dataSource = app.get(DataSource);

  try {
    const employee = await employeesService.findByEmail(email);
    console.log('Employee record:');
    console.dir(employee, { depth: 3 });

    // Also check users table in case the account is a system user
    try {
      const users = await dataSource.query('SELECT * FROM "user" WHERE lower(email) = lower($1)', [email]);
      console.log('Matching user records (users table):');
      console.dir(users, { depth: 2 });
    } catch (ue) {
      // ignore
    }

    if (!employee) {
      // buscar coincidencias parciales
      try {
        const partial = await dataSource.query('SELECT id, email FROM employees WHERE lower(email) LIKE lower($1)', [`%${email}%`]);
        console.log('Partial matches in employees table:');
        console.dir(partial, { depth: 2 });
      } catch (pe) {
        // ignore
      }
    }

    if (employee && dataSource) {
      const at = await dataSource.getRepository('activation_token').find({ where: { employeeId: employee.id } }).catch(async () => {
        // fallback raw query
        return await dataSource.query('SELECT * FROM activation_tokens WHERE "employeeId" = $1', [employee.id]);
      });
      console.log('Activation tokens:');
      console.dir(at, { depth: 3 });

      const refreshs = await dataSource.getRepository('refresh_token').find({ where: { ownerId: employee.id } }).catch(async () => {
        return await dataSource.query('SELECT * FROM refresh_tokens WHERE "ownerId" = $1', [employee.id]);
      });
      console.log('Refresh tokens:');
      console.dir(refreshs, { depth: 2 });
    }
  } catch (err: any) {
    console.error('Error querying employee info:', err?.message || err);
  }

  await app.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
