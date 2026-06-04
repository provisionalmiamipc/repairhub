import { environment as productionEnvironment } from './environment.production';

export const environment = {
  ...productionEnvironment,
  apiUrl: 'http://localhost:3000',
};
