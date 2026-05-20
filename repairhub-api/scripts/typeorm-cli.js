const { existsSync } = require('fs');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const isRailway = Boolean(
  process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.RAILWAY_SERVICE_ID,
);
const isProduction = process.env.NODE_ENV === 'production' || isRailway;
const prodDataSource = 'dist/src/config/data-source.js';
const useProdDataSource = isProduction && existsSync(prodDataSource);

const command = useProdDataSource ? 'typeorm' : 'typeorm-ts-node-commonjs';
const dataSource = useProdDataSource
  ? prodDataSource
  : 'src/config/data-source.ts';

const result = spawnSync(command, [...args, '-d', dataSource], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
