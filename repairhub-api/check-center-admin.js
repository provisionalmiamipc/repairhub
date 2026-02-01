const { createConnection } = require('typeorm');
const path = require('path');

async function check() {
  try {
    const conn = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'repairhub',
      entities: ['src/**/*.entity.ts'],
      synchronize: false,
      logging: false
    });

    const result = await conn.query('SELECT id, email, is_center_admin, employee_type FROM employees WHERE id = 1');
    console.log('Employee:', result);
    
    await conn.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();
