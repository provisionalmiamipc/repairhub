import { NotFoundException } from '@nestjs/common';
import { PublicOrderStatusService } from './public-order-status.service';

describe('PublicOrderStatusService', () => {
  const repository = {
    findOne: jest.fn(),
  };

  let service: PublicOrderStatusService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PublicOrderStatusService(repository as any);
  });

  it.each([
    ['SO00045', 'SO00045'],
    ['#SO00045', 'SO00045'],
    ['# SO 00045', 'SO00045'],
    ['45', 'SO00045'],
    ['00045', 'SO00045'],
  ])('normalizes %s as %s', (input, expected) => {
    expect(service.normalizeOrderCode(input)).toBe(expected);
  });

  it('returns only public service order fields when contact matches', async () => {
    repository.findOne.mockResolvedValue({
      id: 99,
      orderCode: 'SO00045',
      createdAt: new Date('2026-07-01T12:00:00Z'),
      updatedAt: new Date('2026-07-02T12:00:00Z'),
      customer: {
        id: 20,
        email: 'customer@example.com',
        phone: '+1 (305) 555-0101',
      },
      device: { id: 1, name: 'Camera' },
      deviceBrand: { id: 2, name: 'Canon' },
      model: 'EOS R5',
      serial: 'ABC123456',
      defectivePart: 'Sensor cleaning',
      repairStatus: [
        { id: 1, status: 'Pending', createdAt: new Date('2026-07-01T12:00:00Z') },
        { id: 2, status: 'In repair', createdAt: new Date('2026-07-02T12:00:00Z') },
      ],
      sodiagnostic: [
        { id: 3, diagnostic: 'Shared diagnostic', sendEmail: true, createdAt: new Date('2026-07-02T13:00:00Z') },
        { id: 4, diagnostic: 'Internal diagnostic', sendEmail: false, createdAt: new Date('2026-07-02T14:00:00Z') },
      ],
      receivedParts: [{ id: 5, accessory: 'Battery', observations: 'Included' }],
      warranties: [],
      warrantyDuration: 6,
      warrantyDurationUnit: 'months',
      price: 500,
      repairCost: 100,
      assignedTechId: 7,
    });

    const result = await service.track({
      contact: 'CUSTOMER@example.com',
      orderNumber: '# SO 45',
    }, '127.0.0.1');

    expect(repository.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { orderCode: 'SO00045' },
    }));
    expect(result).toEqual(expect.objectContaining({
      orderCode: 'SO00045',
      currentStatus: 'In repair',
      reportedIssue: 'Sensor cleaning',
      diagnostics: [{ title: 'Shared diagnostic', date: '2026-07-02T13:00:00.000Z' }],
    }));
    expect(JSON.stringify(result)).not.toContain('assignedTech');
    expect(JSON.stringify(result)).not.toContain('price');
    expect(JSON.stringify(result)).not.toContain('"id"');
  });

  it('uses a generic not found error when contact does not match', async () => {
    repository.findOne.mockResolvedValue({
      orderCode: 'SO00045',
      customer: { email: 'customer@example.com', phone: '3055550101' },
    });

    await expect(service.track({
      contact: 'other@example.com',
      orderNumber: 'SO00045',
    }, '127.0.0.2')).rejects.toMatchObject({
      response: expect.objectContaining({
        message: 'We could not find an order matching those details.',
      }),
    });
  });
});
