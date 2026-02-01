# Opción B - Fase 2: Integración PIN Modal + Guards + Lock Account

## 📋 Objetivos Fase 2

1. **Integrar PIN Modal en Login Component** - Mostrar modal después de login exitoso para empleados
2. **Agregar estado PIN Verificado** - Rastrear si PIN ha sido verificado en esta sesión
3. **Proteger Rutas con Guard** - Crear/actualizar guard para verificar PIN antes de acceder a rutas de empleado
4. **Lock Account Integration** - Conectar botón "Lock Account" con el sistema de PIN
5. **Inactividad con PIN** - Cuando expira inactividad, mostrar modal PIN para reactivar

## 🔐 Flujo Completo

```
LOGIN EXITOSO (employee)
    ↓
Almacenar Token JWT + employee data
    ↓
MOSTRAR PIN MODAL
    ↓
Ingresa PIN válido → VERIFICAR PIN
    ↓
Si verificación exitosa → Almacenar estado "PIN_VERIFIED"
    ↓
Navegar a Dashboard
    ↓
[DURANTE LA SESIÓN]
    ↓
Usuario inactivo > timeout
    ↓
isLocked = true + LOS PIN MODAL
    ↓
Ingresa PIN → VERIFICAR + Marcar PIN_VERIFIED
    ↓
Reanudar Dashboard

[O]

LOCK ACCOUNT (manual click)
    ↓
isLocked = true
    ↓
MOSTRAR PIN MODAL
    ↓
Verificar PIN → Reactivar sesión
```

## 🛠️ Cambios Requeridos

### 1. AuthService Enhancements

**Nuevo estado: PIN Verificado**
```typescript
private pinVerifiedSubject = new BehaviorSubject<boolean>(false);
public pinVerified$ = this.pinVerifiedSubject.asObservable();

// Métodos
isPinVerified(): boolean
setPinVerified(verified: boolean): void
resetPinVerification(): void // Cuando hay lock/logout
```

**Método lockAccount() mejorado**
```typescript
lockAccount(): void {
  const employee = this.employeeSubject.value;
  if (employee) {
    this.employeeSubject.next({ ...employee, isLocked: true });
    this.pinVerifiedSubject.next(false);  // Resetear PIN verificado
    this.inactivityTimer?.unsubscribe();
  }
}
```

### 2. LoginComponent Changes

**Adicionar**
- Imports: PinInputModalComponent
- @ViewChild para acceder al PIN modal
- Propiedades: showPinModal, pinModalError
- Métodos: onPinSubmit, onPinCancel, handlePinError, handlePinSuccess

**Flujo**
```typescript
1. User login exitoso (existing logic)
2. Verificar: response.userType === 'employee'
3. Si es employee:
   - Mostrar PIN modal (showPinModal = true)
   - Esperar respuesta PIN
4. Si PIN válido:
   - Navigate to dashboard
5. Si PIN inválido:
   - Mostrar error + intentos
   - Max 3 intentos → bloquear
```

### 3. PIN Verification Guard

**Crear/Actualizar: `pin-verification.guard.ts`**
```typescript
export const pinVerificationGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const userType = authService.getUserType();
  
  // Solo empleados necesitan PIN
  if (userType !== 'employee') {
    return true; // Usuarios normales pasan
  }

  // Si empleado está bloqueado → mostrar PIN (redirigir a /verify-pin)
  if (authService.isEmployeeLocked()) {
    router.navigate(['/verify-pin']);
    return false;
  }

  // Si empleado no ha verificado PIN en esta sesión → redirigir a /verify-pin
  if (!authService.isPinVerified()) {
    router.navigate(['/verify-pin']);
    return false;
  }

  return true; // Permitir acceso
};
```

### 4. Verify PIN Page (Nuevo)

**Crear ruta: `/verify-pin`**
- Mostrar PIN Modal sin botón cerrar
- Manejar PIN inválido con reintentos
- Después de verificación exitosa → redirigir a dashboard

### 5. DefaultHeader Integration

**Actualizar Lock Account button**
```html
<a cDropdownItem (click)="onLockAccount()">
  <svg cIcon class="me-2" name="cilLockLocked"></svg>
  Lock Account
</a>
```

```typescript
onLockAccount(): void {
  this.authService.lockAccount();
  this.router.navigate(['/verify-pin']);
}
```

### 6. App.routes Integration

**Actualizar rutas para proteger con guard**
```typescript
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [pinVerificationGuard]  // ← Nuevo
}
// ... otras rutas de empleado también con guard
```

## 📝 Cambios Específicos de Código

### AuthService
- [ ] Agregar `pinVerifiedSubject` BehaviorSubject
- [ ] Agregar getter `isPinVerified()`
- [ ] Agregar setter `setPinVerified(verified)`
- [ ] Mejorar `lockAccount()` para resetear PIN verified
- [ ] Mejorar `lockSession()` para resetear PIN verified
- [ ] Actualizar `login()` para resetear PIN verified al login
- [ ] Actualizar `unlockSession()` para marcar PIN como verificado
- [ ] Agregar persistencia de PIN verified en localStorage

### LoginComponent
- [ ] Importar PinInputModalComponent
- [ ] Agregar propiedades: showPinModal, pinModalError, userTypeNeedingPin
- [ ] Agregar método `onPinSubmit(pin: string)`
- [ ] Agregar método `onPinCancel()`
- [ ] Agregar método `handlePinSuccess()`
- [ ] Agregar método `handlePinError(error: string)`
- [ ] Modificar `handleSuccessfulLogin()` para mostrar PIN modal si es empleado

### DefaultHeaderComponent
- [ ] Inyectar AuthService
- [ ] Agregar método `onLockAccount()`
- [ ] Conectar Click handler en template

### pin-verification.guard.ts (Nueva)
- [ ] Crear guard que verifique PIN verified status
- [ ] Redirigir a /verify-pin si es necesario

### Componente Verify PIN Page (Nuevo)
- [ ] Crear componente standalone
- [ ] Mostrar PinInputModalComponent sin opción de cerrar
- [ ] Manejar reintentos
- [ ] Redirigir tras verificación exitosa

### app.routes.ts
- [ ] Agregar ruta /verify-pin
- [ ] Aplicar pinVerificationGuard a rutas protegidas

## 🧪 Tests Requeridos

- [ ] AuthService tests para `isPinVerified()`, `setPinVerified()`, `lockAccount()`
- [ ] LoginComponent tests para flujo PIN modal
- [ ] pinVerificationGuard tests
- [ ] DefaultHeaderComponent tests para lock account
- [ ] Verificar que localStorage se sincroniza correctamente

## ⏱️ Estimado: 2-3 horas

---

**Estado**: Pendiente ejecución
**Próximo Paso**: Iniciar con AuthService enhancements
