import { ConfigService } from '@nestjs/config';
import { SquarePaymentLinksService } from './square-payment-links.service';

describe('SquarePaymentLinksService', () => {
  const config = new ConfigService({
    SQUARE_ACCESS_TOKEN: 'token',
    SQUARE_LOCATION_ID: 'location',
    SQUARE_ENVIRONMENT: 'sandbox',
  });
  const service = new SquarePaymentLinksService(config);

  afterEach(() => jest.restoreAllMocks());

  it('detects a completed payment even when the Square order remains open', async () => {
    jest.spyOn(service as any, 'request')
      .mockResolvedValueOnce({ order: { id: 'order-1', state: 'OPEN' } })
      .mockResolvedValueOnce({
        payments: [{ order_id: 'order-1', status: 'COMPLETED' }],
      });

    await expect(service.isOrderPaid('order-1')).resolves.toBe(true);
  });

  it('keeps the link pending when no associated payment is completed', async () => {
    jest.spyOn(service as any, 'request')
      .mockResolvedValueOnce({ order: { id: 'order-1', state: 'OPEN' } })
      .mockResolvedValueOnce({
        payments: [{ order_id: 'order-1', status: 'APPROVED' }],
      });

    await expect(service.isOrderPaid('order-1')).resolves.toBe(false);
  });
});
