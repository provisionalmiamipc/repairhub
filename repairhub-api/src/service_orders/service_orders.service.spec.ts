import { ServiceOrdersService } from './service_orders.service';

describe('ServiceOrdersService', () => {
  const service = new ServiceOrdersService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    undefined,
    undefined,
    undefined,
    undefined,
  );

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('calculates discount before tax and keeps cents', () => {
    const result = (service as any).calculateFinancials({
      price: 100,
      costdiscount: 10,
      tax: 7,
    });

    expect(result).toEqual({
      discountAmount: 10,
      taxAmount: 6.3,
      taxPercent: 7,
      total: 96.3,
    });
  });
});
