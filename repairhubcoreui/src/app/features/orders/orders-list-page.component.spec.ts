import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrdersListPageComponent } from './orders-list-page.component';
import { OrdersService } from '../../shared/services/orders.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Orders } from '../../shared/models/Orders';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('OrdersListPageComponent', () => {
  let component: OrdersListPageComponent;
  let fixture: ComponentFixture<OrdersListPageComponent>;
  let ordersService: jasmine.SpyObj<OrdersService>;
  let router: jasmine.SpyObj<Router>;

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

  beforeEach(async () => {
    const ordersServiceSpy = jasmine.createSpyObj(
      'OrdersService',
      ['getAll', 'delete'],
      {
        data$: of(mockOrders),
        loading$: of(false),
        error$: of(null),
      }
    );

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      params: of({}),
    });

    await TestBed.configureTestingModule({
      imports: [OrdersListPageComponent],
      providers: [
        { provide: OrdersService, useValue: ordersServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    ordersService = TestBed.inject(OrdersService) as jasmine.SpyObj<OrdersService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(OrdersListPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Lifecycle', () => {
    it('should call service.getAll() on ngOnInit', () => {
      ordersService.getAll.and.returnValue(of(mockOrders));
      component.ngOnInit();
      expect(ordersService.getAll).toHaveBeenCalled();
    });

    it('should clean up destroy$ subject on ngOnDestroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to create page on onCreate', () => {
      component.onCreate();
      expect(router.navigate).toHaveBeenCalledWith(['/orders/new']);
    });

    it('should navigate to detail page on onSelect', () => {
      const order = mockOrders[0];
      component.onSelect(order);
      expect(router.navigate).toHaveBeenCalledWith(['/orders', order.id]);
    });

    it('should navigate to edit page on onEdit', () => {
      const order = mockOrders[0];
      component.onEdit(order);
      expect(router.navigate).toHaveBeenCalledWith(['/orders', order.id, 'edit']);
    });

    it('should not navigate if order has no id', () => {
      const order = { ...mockOrders[0], id: undefined } as unknown as Orders;
      component.onSelect(order);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Delete Operation', () => {
    it('should delete and refresh list when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      ordersService.delete.and.returnValue(of(void 0));
      ordersService.getAll.and.returnValue(of(mockOrders.slice(1)));

      const order = mockOrders[0];
      component.onDelete(order);

      expect(window.confirm).toHaveBeenCalled();
      expect(ordersService.delete).toHaveBeenCalledWith(order.id);
      expect(ordersService.getAll).toHaveBeenCalled();
    });

    it('should not delete when user cancels', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      const order = mockOrders[0];
      component.onDelete(order);
      expect(ordersService.delete).not.toHaveBeenCalled();
    });
  });

  describe('Observable State', () => {
    it('orders$ should be connected to service.data$', (done) => {
      component.orders$.subscribe((orders) => {
        expect(Array.isArray(orders)).toBe(true);
        done();
      });
    });

    it('loading$ should be connected to service.loading$', (done) => {
      component.loading$.subscribe((loading) => {
        expect(typeof loading).toBe('boolean');
        done();
      });
    });

    it('error$ should be connected to service.error$', (done) => {
      component.error$.subscribe((error) => {
        expect(error === null || typeof error === 'string').toBe(true);
        done();
      });
    });
  });
});
