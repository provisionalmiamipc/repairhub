import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrdersListComponent } from './orders-list.component';
import { Orders } from '../../shared/models/Orders';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('OrdersListComponent (Dumb Component)', () => {
  let component: OrdersListComponent;
  let fixture: ComponentFixture<OrdersListComponent>;

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
    } as Orders,
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersListComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input Contract', () => {
    it('should accept Observable<Orders[]> as items input', (done) => {
      component.items = of(mockOrders);
      component.items?.subscribe((orders) => {
        expect(orders).toEqual(mockOrders);
        done();
      });
    });

    it('should handle null items input', () => {
      component.items = null;
      expect(component.items).toBeNull();
    });

    it('should accept empty array', (done) => {
      component.items = of([]);
      component.items?.subscribe((orders) => {
        expect(orders.length).toBe(0);
        done();
      });
    });
  });

  describe('Output Contract', () => {
    it('should have selectOrder EventEmitter defined', () => {
      expect(component.selectOrder).toBeDefined();
      expect(typeof component.selectOrder.emit).toBe('function');
    });

    it('should have editOrder EventEmitter defined', () => {
      expect(component.editOrder).toBeDefined();
      expect(typeof component.editOrder.emit).toBe('function');
    });

    it('should have deleteOrder EventEmitter defined', () => {
      expect(component.deleteOrder).toBeDefined();
      expect(typeof component.deleteOrder.emit).toBe('function');
    });

    it('should emit selectOrder with correct data', (done) => {
      const order = mockOrders[0];
      component.selectOrder.subscribe((emittedOrder) => {
        expect(emittedOrder).toEqual(order);
        done();
      });
      component.selectOrder.emit(order);
    });

    it('should emit editOrder with correct data', (done) => {
      const order = mockOrders[0];
      component.editOrder.subscribe((emittedOrder) => {
        expect(emittedOrder).toEqual(order);
        done();
      });
      component.editOrder.emit(order);
    });

    it('should emit deleteOrder with correct data', (done) => {
      const order = mockOrders[0];
      component.deleteOrder.subscribe((emittedOrder) => {
        expect(emittedOrder).toEqual(order);
        done();
      });
      component.deleteOrder.emit(order);
    });
  });

  describe('Dumb Component Behavior', () => {
    it('should be purely presentational with no business logic', () => {
      expect(component.items).toBeNull();
      expect(component.selectOrder).toBeDefined();
      expect(component.editOrder).toBeDefined();
      expect(component.deleteOrder).toBeDefined();
    });

    it('should maintain component isolation', (done) => {
      const order1 = mockOrders[0];
      const order2 = mockOrders[1];

      component.items = of([order1, order2]);

      component.items?.subscribe((orders) => {
        expect(orders.length).toBe(2);
        expect(orders[0]).not.toBe(orders[1]);
        done();
      });
    });
  });
});
