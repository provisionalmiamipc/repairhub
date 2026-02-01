import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrdersFormComponent } from './orders-form.component';
import { Orders } from '../../shared/models/Orders';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA, SimpleChange, SimpleChanges } from '@angular/core';

describe('OrdersFormComponent', () => {
  let component: OrdersFormComponent;
  let fixture: ComponentFixture<OrdersFormComponent>;

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersFormComponent, ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize FormGroup', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('totalPrice')).toBeTruthy();
      expect(component.form.get('totalCost')).toBeTruthy();
      expect(component.form.get('tax')).toBeTruthy();
      expect(component.form.get('advancePayment')).toBeTruthy();
      expect(component.form.get('note')).toBeTruthy();
      expect(component.form.get('cloused')).toBeTruthy();
      expect(component.form.get('canceled')).toBeTruthy();
    });

    it('should have totalPrice and totalCost as required', () => {
      const totalPrice = component.form.get('totalPrice');
      const totalCost = component.form.get('totalCost');

      totalPrice?.setValue(null);
      totalCost?.setValue(null);

      expect(totalPrice?.hasError('required')).toBe(true);
      expect(totalCost?.hasError('required')).toBe(true);
    });
  });

  describe('Form Getters', () => {
    it('should provide getter for totalPrice', () => {
      expect(component.totalPrice).toBe(component.form.get('totalPrice'));
    });

    it('should provide getter for totalCost', () => {
      expect(component.totalCost).toBe(component.form.get('totalCost'));
    });

    it('should provide getter for tax', () => {
      expect(component.tax).toBe(component.form.get('tax'));
    });

    it('should provide getter for advancePayment', () => {
      expect(component.advancePayment).toBe(component.form.get('advancePayment'));
    });

    it('should provide getter for note', () => {
      expect(component.note).toBe(component.form.get('note'));
    });

    it('should provide getter for cloused', () => {
      expect(component.cloused).toBe(component.form.get('cloused'));
    });

    it('should provide getter for canceled', () => {
      expect(component.canceled).toBe(component.form.get('canceled'));
    });
  });

  describe('Input Binding', () => {
    it('should patch form with order values on ngOnChanges', () => {
      component.order = mockOrder;
      component.ngOnChanges();

      expect(component.form.get('totalPrice')?.value).toBe(100);
      expect(component.form.get('totalCost')?.value).toBe(80);
      expect(component.form.get('tax')?.value).toBe(10);
      expect(component.form.get('advancePayment')?.value).toBe(20);
    });

    it('should handle null order', () => {
      component.order = null;
      expect(component.form).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should be invalid when required fields are empty', () => {
      component.form.reset();
      expect(component.form.valid).toBe(false);
    });

    it('should be valid when required fields have values', () => {
      component.form.patchValue({
        totalPrice: 100,
        totalCost: 80,
      });
      expect(component.form.valid).toBe(true);
    });

    it('should validate minimum values for price fields', () => {
      const totalPrice = component.form.get('totalPrice');
      totalPrice?.setValue(-10);
      expect(totalPrice?.hasError('min')).toBe(true);

      totalPrice?.setValue(100);
      expect(totalPrice?.hasError('min')).toBe(false);
    });
  });

  describe('Form Submission', () => {
    it('should emit save event when form is valid', () => {
      spyOn(component.save, 'emit');

      component.form.patchValue({
        totalPrice: 100,
        totalCost: 80,
      });

      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalled();
    });

    it('should not emit save when form is invalid', () => {
      spyOn(component.save, 'emit');

      component.form.reset();
      component.onSubmit();

      expect(component.save.emit).not.toHaveBeenCalled();
    });

    it('should emit correct form values', () => {
      spyOn(component.save, 'emit');

      const data = {
        totalPrice: 150,
        totalCost: 120,
        tax: 15,
        advancePayment: 30,
      };

      component.form.patchValue(data);
      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalledWith(jasmine.objectContaining(data));
    });
  });

  describe('Form State', () => {
    it('should track dirty state when markAsDirty is called', () => {
      expect(component.form.pristine).toBe(true);

      component.form.markAsDirty();

      expect(component.form.dirty).toBe(true);
    });

    it('should track touched state', () => {
      const control = component.form.get('totalPrice');
      expect(control?.untouched).toBe(true);

      control?.markAsTouched();
      expect(control?.touched).toBe(true);
    });
  });

  describe('Field-specific Validation', () => {
    it('should validate totalPrice required and min', () => {
      const control = component.form.get('totalPrice');

      control?.setValue(null);
      expect(control?.hasError('required')).toBe(true);

      control?.setValue(0);
      expect(control?.hasError('required')).toBe(false);
      expect(control?.hasError('min')).toBe(false);
    });

    it('should validate tax and advancePayment as optional with min 0', () => {
      const tax = component.form.get('tax');
      const advance = component.form.get('advancePayment');

      tax?.setValue(-5);
      advance?.setValue(-5);

      expect(tax?.hasError('min')).toBe(true);
      expect(advance?.hasError('min')).toBe(true);

      tax?.setValue(10);
      advance?.setValue(20);

      expect(tax?.valid).toBe(true);
      expect(advance?.valid).toBe(true);
    });
  });
});
