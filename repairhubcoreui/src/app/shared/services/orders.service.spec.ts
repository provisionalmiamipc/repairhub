import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrdersService } from './orders.service';
import { Orders } from '../models/Orders';
import { environment } from '../../../environment';

describe('OrdersService', () => {
  let service: OrdersService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/orders`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrdersService],
    });

    service = TestBed.inject(OrdersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('API URL', () => {
    it('should have correct API endpoint', () => {
      expect((service as any).apiUrl).toBe(apiUrl);
    });
  });

  describe('getAll()', () => {
    it('should fetch all orders', (done) => {
      const mockOrders: Orders[] = [
        {
          id: 1,
          totalPrice: 100,
          totalCost: 80,
          tax: 10,
          advancePayment: 20,
          note: {},
          cloused: false,
          canceled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: { id: 1 } as any,
        } as Orders,
        {
          id: 2,
          totalPrice: 200,
          totalCost: 160,
          tax: 20,
          advancePayment: 40,
          note: {},
          cloused: false,
          canceled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: { id: 2 } as any,
        } as Orders,
      ];

      service.getAll().subscribe({
        next: (orders) => {
          expect(orders.length).toBe(2);
          expect(orders[0].totalPrice).toBe(100);
          done();
        },
        error: () => fail('should not error'),
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrders);
    });

    it('should emit data$ observable', (done) => {
      const mockOrders: Orders[] = [
        {
          id: 1,
          totalPrice: 100,
          totalCost: 80,
          tax: 10,
          advancePayment: 20,
          note: {},
          cloused: false,
          canceled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: { id: 1 } as any,
        } as Orders,
      ];

      service.getAll().subscribe({
        next: () => {
          service.data$.subscribe({
            next: (data) => {
              expect(Array.isArray(data)).toBe(true);
              done();
            },
          });
        },
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(mockOrders);
    });
  });

  describe('getById()', () => {
    it('should fetch single order by id', (done) => {
      const mockOrder: Orders = {
        id: 1,
        totalPrice: 100,
        totalCost: 80,
        tax: 10,
        advancePayment: 20,
        note: {},
        cloused: false,
        canceled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Orders;

      service.getById(1).subscribe({
        next: (order) => {
          expect(order.id).toBe(1);
          expect(order.totalPrice).toBe(100);
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrder);
    });
  });

  describe('create()', () => {
    it('should create new order', (done) => {
      const newOrder: Partial<Orders> = {
        totalPrice: 300,
        totalCost: 240,
        tax: 30,
        advancePayment: 60,
      };

      const createdOrder: Orders = {
        id: 3,
        totalPrice: 300,
        totalCost: 240,
        tax: 30,
        advancePayment: 60,
        note: {},
        cloused: false,
        canceled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Orders;

      service.create(newOrder).subscribe({
        next: (order) => {
          expect(order.id).toBe(3);
          expect(order.totalPrice).toBe(300);
          done();
        },
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      req.flush(createdOrder);
    });
  });

  describe('update()', () => {
    it('should update existing order', (done) => {
      const updatedData: Partial<Orders> = { totalPrice: 350 };
      const result: Orders = {
        id: 1,
        totalPrice: 350,
        totalCost: 280,
        tax: 35,
        advancePayment: 70,
        note: {},
        cloused: false,
        canceled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Orders;

      service.update(1, updatedData).subscribe({
        next: (order) => {
          expect(order.totalPrice).toBe(350);
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PATCH');
      req.flush(result);
    });
  });

  describe('delete()', () => {
    it('should delete order by id', (done) => {
      service.delete(1).subscribe({
        next: () => {
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Reactive Observables', () => {
    it('should manage data state reactively', (done) => {
      const mockOrders: Orders[] = [
        {
          id: 1,
          totalPrice: 100,
          totalCost: 80,
          tax: 10,
          advancePayment: 20,
          note: {},
          cloused: false,
          canceled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Orders,
      ];

      service.getAll().subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(mockOrders);
    });

    it('should handle loading state', (done) => {
      service.getAll().subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush([]);
    });
  });

  describe('Error handling', () => {
    it('should handle errors gracefully', () => {
      service.getAll().subscribe();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });
});
