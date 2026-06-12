import { ServiceOrdersController } from './service_orders.controller';

describe('ServiceOrdersController', () => {
  const controller = new ServiceOrdersController({} as any, {} as any);

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
