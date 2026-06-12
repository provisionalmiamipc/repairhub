import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ServiceOrderPaymentLinksService } from './service-order-payment-links.service';

describe('ServiceOrderPaymentLinksService', () => {
  const repository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 1, ...value })),
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const orderRepository = {
    findOne: jest.fn(async () => ({ id: 10, createdById: 3 })),
  };
  const square = {
    createPaymentLink: jest.fn(),
    isOrderPaid: jest.fn(),
    deletePaymentLink: jest.fn(),
  };
  const service = new ServiceOrderPaymentLinksService(
    repository as any,
    orderRepository as any,
    square as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('allows configured financial roles and rejects regular employees', () => {
    expect(service.canManage({ type: 'user' })).toBe(true);
    expect(service.canManage({ employee_type: 'Accountant' })).toBe(true);
    expect(service.canManage({ employee_type: 'AdminStore' })).toBe(true);
    expect(service.canManage({ employee_type: 'Expert', isCenterAdmin: true })).toBe(true);
    expect(() => service.assertCanManage({ employee_type: 'Expert' })).toThrow(ForbiddenException);
  });

  it('stores a failed record without throwing when Square is unavailable', async () => {
    square.createPaymentLink.mockRejectedValueOnce(new Error('offline'));

    const link = await service.create(10, {
      concept: 'total',
      title: 'Customer - Camera - Total - SO00001',
      amount: 10000,
    });

    expect(link.status).toBe('failed');
    expect(link.lastError).toBe('offline');
  });

  it('stores Square identifiers and URL after successful creation', async () => {
    square.createPaymentLink.mockResolvedValueOnce({
      id: 'link-1',
      orderId: 'order-1',
      url: 'https://square.link/u/test',
    });

    const link = await service.create(10, {
      concept: 'delivery',
      title: 'Customer - Camera - Delivery - SO00001',
      amount: 2500,
    });

    expect(link).toEqual(expect.objectContaining({
      status: 'pending',
      squarePaymentLinkId: 'link-1',
      squareOrderId: 'order-1',
      url: 'https://square.link/u/test',
      amount: '2500',
      currency: 'USD',
    }));
  });

  it('refuses to delete a link that Square reports as paid', async () => {
    repository.findOne.mockResolvedValueOnce({
      id: 1,
      status: 'pending',
      squareOrderId: 'order-1',
      squarePaymentLinkId: 'link-1',
    });
    square.isOrderPaid.mockResolvedValueOnce(true);

    await expect(service.remove(1, { type: 'user' })).rejects.toThrow(BadRequestException);
    expect(square.deletePaymentLink).not.toHaveBeenCalled();
  });

  it('deletes an unpaid link remotely and keeps a local history record', async () => {
    repository.findOne.mockResolvedValueOnce({
      id: 2,
      status: 'pending',
      squareOrderId: 'order-2',
      squarePaymentLinkId: 'link-2',
    });
    square.isOrderPaid.mockResolvedValueOnce(false);
    square.deletePaymentLink.mockResolvedValueOnce(undefined);

    const link = await service.remove(2, { employee_type: 'AdminStore' });

    expect(square.deletePaymentLink).toHaveBeenCalledWith('link-2');
    expect(link.status).toBe('deleted');
    expect(link.deletedAt).toBeInstanceOf(Date);
  });

  it('marks pending links as paid during scheduled synchronization', async () => {
    const pending = {
      id: 3,
      status: 'pending',
      squareOrderId: 'order-3',
      paidAt: null,
    };
    repository.find.mockResolvedValueOnce([pending]);
    square.isOrderPaid.mockResolvedValueOnce(true);

    await service.refreshPendingLinks();

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      id: 3,
      status: 'paid',
      paidAt: expect.any(Date),
      lastCheckedAt: expect.any(Date),
    }));
  });

  it('keeps a pending link pending when Square is temporarily unavailable', async () => {
    const pending = {
      id: 4,
      status: 'pending',
      squareOrderId: 'order-4',
      lastError: null,
    };
    repository.find.mockResolvedValueOnce([pending]);
    square.isOrderPaid.mockRejectedValueOnce(new Error('timeout'));

    await service.refreshPendingLinks();

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      id: 4,
      status: 'pending',
      lastError: 'timeout',
      lastCheckedAt: expect.any(Date),
    }));
  });
});
