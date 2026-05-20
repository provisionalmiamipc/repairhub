import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/user/entities/user.entity';
import { config } from 'dotenv';

config();

async function createAdminUser() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const firstName = process.env.BOOTSTRAP_ADMIN_FIRST_NAME || 'System';
  const lastName = process.env.BOOTSTRAP_ADMIN_LAST_NAME || 'Administrator';

  if (!email || !password) {
    throw new Error('Define BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to create an admin user.');
  }

  const dataSource = new DataSource(process.env.DATABASE_URL ? {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [User],
  } : {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE ?? process.env.DB_NAME,
    entities: [User],
  });

  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);

  const existingAdmin = await userRepository.findOne({
    where: { email }
  });

  if (!existingAdmin) {
    const adminUser = userRepository.create({
      email,
      password: await bcrypt.hash(password, 12),
      firstName,
      lastName,
      isActive: true,
    });

    await userRepository.save(adminUser);
    console.log(`Admin user created: ${email}`);
  } else {
    console.log(`Admin user already exists: ${email}`);
  }

  await dataSource.destroy();
}

createAdminUser().catch(console.error);
