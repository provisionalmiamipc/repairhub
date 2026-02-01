import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/user/entities/user.entity';
import { config } from 'dotenv';

config();

async function createAdminUser() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User],
  });

  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);

  // Verificar si ya existe el admin
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@system.com' }
  });

  if (!existingAdmin) {
    const adminUser = userRepository.create({
      email: 'admin@system.com',
      password: await bcrypt.hash('AdminMasterPass.00', 12),
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
    });

    await userRepository.save(adminUser);
    console.log('✅ Admin user created: admin@system.com / AdminMasterPass.00');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  await dataSource.destroy();
}

createAdminUser().catch(console.error);