import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PinInputModalComponent } from './pin-input-modal.component';
import { ReactiveFormsModule } from '@angular/forms';

describe('PinInputModalComponent', () => {
  let component: PinInputModalComponent;
  let fixture: ComponentFixture<PinInputModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PinInputModalComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PinInputModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería crear el formulario con control PIN', () => {
    expect(component.pinForm.get('pin')).toBeTruthy();
  });

  describe('Validación de PIN', () => {
    it('PIN debería ser requerido', () => {
      const pinControl = component.pinForm.get('pin');
      pinControl?.setValue('');
      expect(pinControl?.hasError('required')).toBeTruthy();
    });

    it('PIN debería tener mínimo 4 dígitos', () => {
      const pinControl = component.pinForm.get('pin');
      pinControl?.setValue('123');
      expect(pinControl?.hasError('minlength')).toBeTruthy();
    });

    it('PIN debería aceptar 4 a 6 dígitos', () => {
      const pinControl = component.pinForm.get('pin');
      pinControl?.setValue('1234');
      expect(pinControl?.valid).toBeTruthy();
      
      pinControl?.setValue('123456');
      expect(pinControl?.valid).toBeTruthy();
    });

    it('PIN no debería aceptar más de 6 dígitos', () => {
      const pinControl = component.pinForm.get('pin');
      pinControl?.setValue('1234567');
      expect(pinControl?.hasError('maxlength')).toBeTruthy();
    });

    it('PIN solo debería aceptar números', () => {
      const pinControl = component.pinForm.get('pin');
      pinControl?.setValue('12a4');
      expect(pinControl?.hasError('pattern')).toBeTruthy();
    });
  });

  describe('Funcionalidad del Modal', () => {
    it('debería mostrar nombre del empleado', () => {
      component.employeeName = 'Juan García';
      component.isOpen = true;
      fixture.detectChanges();
      
      const welcomeText = fixture.nativeElement.querySelector('.pin-modal-welcome');
      expect(welcomeText?.textContent).toBeTruthy();
      expect(welcomeText?.textContent).toContain('Juan García');
    });

    it('debería emitir PIN cuando se envía formulario válido', (done) => {
      component.pinSubmit.subscribe((pin: string) => {
        expect(pin).toBe('1234');
        done();
      });

      component.pinForm.patchValue({ pin: '1234' });
      component.onSubmit();
    });

    it('debería emitir evento cancel cuando se hace clic en cancelar', (done) => {
      component.cancel.subscribe(() => {
        expect(true).toBeTruthy();
        done();
      });

      component.onCancel();
    });

    it('debería deshabilitar botón submit si formulario es inválido', () => {
      component.isOpen = true;
      component.pinForm.patchValue({ pin: '' });
      fixture.detectChanges();

      const submitBtn = fixture.nativeElement.querySelector('.pin-btn-primary');
      expect(submitBtn?.disabled).toBeTruthy();
    });
  });

  describe('Manejo de Errores', () => {
    it('debería mostrar mensaje de error de PIN incorrecto', () => {
      component.onPinError('PIN incorrecto');
      fixture.detectChanges();

      expect(component.errorMessage).toBe('PIN incorrecto');
      expect(component.attemptCount).toBe(1);
    });

    it('debería incrementar contador de intentos en cada error', () => {
      component.onPinError('Error 1');
      expect(component.attemptCount).toBe(1);

      component.onPinError('Error 2');
      expect(component.attemptCount).toBe(2);
    });

    it('debería deshabilitar formulario después de máximo intentos', () => {
      for (let i = 0; i < component.maxAttempts; i++) {
        component.onPinError(`Intento ${i + 1}`);
      }

      expect(component.pinForm.disabled).toBeTruthy();
      expect(component.errorMessage).toContain('Máximo de intentos alcanzado');
    });
  });

  describe('Funciones de Utilidad', () => {
    it('getPinError() debería retornar mensaje apropiado', () => {
      const pinControl = component.pinForm.get('pin');
      
      // Required
      pinControl?.setValue('');
      pinControl?.markAsTouched();
      expect(component.getPinError()).toContain('requerido');

      // Min length
      pinControl?.setValue('123');
      expect(component.getPinError()).toContain('al menos 4');

      // Pattern
      pinControl?.setValue('12a4');
      expect(component.getPinError()).toContain('números');
    });

    it('onPinInput() debería filtrar solo números', () => {
      const event = {
        target: { value: '12a3b4' }
      };
      component.onPinInput(event);
      
      // onPinInput filtra caracteres no numéricos: '12a3b4' -> '1234'
      const result = component.pinForm.get('pin')?.value;
      expect(result).toBe('1234');
    });

    it('onPinInput() debería limitar a 6 caracteres', () => {
      const event = {
        target: { value: '12345678' }
      };
      component.onPinInput(event);

      const result = component.pinForm.get('pin')?.value;
      expect(result?.length).toBeLessThanOrEqual(6);
    });
  });

  describe('Estado del Modal', () => {
    it('debería mostrar modal cuando isOpen es true', () => {
      component.isOpen = true;
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.pin-modal-overlay');
      expect(overlay).toBeTruthy();
    });

    it('debería ocultar modal cuando isOpen es false', () => {
      component.isOpen = false;
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.pin-modal-overlay');
      expect(overlay).toBeFalsy();
    });

    it('debería mostrar loading state durante verificación', () => {
      component.isOpen = true;
      component.isLoading = true;
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('.pin-spinner');
      expect(spinner).toBeTruthy();
    });
  });
});
