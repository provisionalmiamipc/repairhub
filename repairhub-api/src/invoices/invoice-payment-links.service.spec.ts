import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { InvoicePaymentLinksService } from './invoice-payment-links.service';

describe('InvoicePaymentLinksService', () => {
  const paymentLinkRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 1, ...value })),
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const invoiceRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const square = {
    createPaymentLink: jest.fn(),
    isOrderPaid: jest.fn(),
    deletePaymentLink: jest.fn(),
  };
  const service = new InvoicePaymentLinksService(
    paymentLinkRepo as any,
    invoiceRepo as any,
    square as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    invoiceRepo.findOne.mockResolvedValue({
      id: 10,
      invoiceNumber: '00000010',
      status: 'issued',
      total: 125.5,
      billToName: 'Jane Doe',
      createdById: 3,
    });
    paymentLinkRepo.findOne.mockResolvedValue(null);
  });

  it('allows configured financial roles and rejects regular employees', () => {
    expect(service.canManage({ type: 'user' })).toBe(true);
    expect(service.canManage({ employee_type: 'Accountant' })).toBe(true);
    expect(service.canManage({ employee_type: 'AdminStore' })).toBe(true);
    expect(service.canManage({ employee_type: 'Expert', isCenterAdmin: true })).toBe(true);
    expect(() => service.assertCanManage({ employee_type: 'Expert' })).toThrow(ForbiddenException);
  });

  it('creates one link for the exact invoice total in cents', async () => {
    square.createPaymentLink.mockResolvedValue({
      id: 'link-1',
      orderId: 'order-1',
      url: 'https://square.link/u/invoice',
    });

    const link = await service.create(10, { type: 'user', id: 7 });

    expect(square.createPaymentLink).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Jane Doe - Invoice 00000010',
      amount: 12550,
      currency: 'USD',
    }));
    expect(link).toEqual(expect.objectContaining({
      status: 'pending',
      amount: '12550',
      url: 'https://square.link/u/invoice',
    }));
  });

  it('keeps a failed local record when Square is unavailable', async () => {
    square.createPaymentLink.mockRejectedValue(new Error('offline'));

    const link = await service.create(10, { employee_type: 'Accountant' });

    expect(link.status).toBe('failed');
    expect(link.lastError).toBe('offline');
  });

  it('rejects draft, zero-total and duplicate active links', async () => {
    invoiceRepo.findOne.mockResolvedValueOnce({ id: 10, status: 'draft', total: 10 });
    await expect(service.create(10, { type: 'user' })).rejects.toThrow(BadRequestException);

    invoiceRepo.findOne.mockResolvedValueOnce({ id: 10, status: 'issued', total: 0 });
    await expect(service.create(10, { type: 'user' })).rejects.toThrow(BadRequestException);

    paymentLinkRepo.findOne.mockResolvedValueOnce({ id: 2, status: 'pending' });
    await expect(service.create(10, { type: 'user' })).rejects.toThrow(BadRequestException);
  });

  it('marks both the link and issued invoice paid during synchronization', async () => {
    const pending = {
      id: 3,
      invoiceId: 10,
      status: 'pending',
      squareOrderId: 'order-3',
      paidAt: null,
    };
    paymentLinkRepo.find.mockResolvedValue([pending]);
    square.isOrderPaid.mockResolvedValue(true);

    await service.refreshPendingLinks();

    expect(paymentLinkRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'paid',
      paidAt: expect.any(Date),
    }));
    expect(invoiceRepo.update).toHaveBeenCalledWith(
      { id: 10, status: 'issued' },
      { status: 'paid' },
    );
    expect(paymentLinkRepo.find).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: 'pending',
        createdAt: expect.any(Object),
      }),
      take: 100,
    }));
  });

  it('checks a pending link immediately and marks the invoice paid', async () => {
    const pending = {
      id: 6,
      invoiceId: 10,
      status: 'pending',
      squareOrderId: 'order-6',
      paidAt: null,
    };
    paymentLinkRepo.findOne.mockResolvedValue(pending);
    square.isOrderPaid.mockResolvedValue(true);

    const link = await service.checkStatus(10, 6, { type: 'user' });

    expect(link.status).toBe('paid');
    expect(invoiceRepo.update).toHaveBeenCalledWith(
      { id: 10, status: 'issued' },
      { status: 'paid' },
    );
  });

  it('checks Square and deletes an unpaid link remotely', async () => {
    paymentLinkRepo.findOne.mockResolvedValue({
      id: 4,
      invoiceId: 10,
      status: 'pending',
      squareOrderId: 'order-4',
      squarePaymentLinkId: 'link-4',
    });
    square.isOrderPaid.mockResolvedValue(false);

    const link = await service.remove(10, 4, { employee_type: 'AdminStore' });

    expect(square.deletePaymentLink).toHaveBeenCalledWith('link-4');
    expect(link.status).toBe('deleted');
  });

  it('does not delete a link that Square reports as paid', async () => {
    paymentLinkRepo.findOne.mockResolvedValue({
      id: 5,
      invoiceId: 10,
      status: 'pending',
      squareOrderId: 'order-5',
      squarePaymentLinkId: 'link-5',
    });
    square.isOrderPaid.mockResolvedValue(true);

    await expect(service.remove(10, 5, { type: 'user' })).rejects.toThrow(BadRequestException);
    expect(square.deletePaymentLink).not.toHaveBeenCalled();
  });
});
