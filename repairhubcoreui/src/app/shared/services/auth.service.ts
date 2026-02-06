// services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
//import { Employees, Users, AuthResponse } from '../models';
import { EmployeeRole, EmployeeType, RolePermissions } from '../models/constants/roles.constants';
import { RoleService } from './role.service';
import { AuthResponse } from '../models/auth-response.model';
import { VerifyPinRequest, VerifyPinResponse } from '../models/pin-verification.model';
import { Employees } from '../models/Employees';
import { Users } from '../models/Users';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/api/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_TYPE_KEY = 'user_type';
  private readonly EMPLOYEE_DATA_KEY = 'employee_data';
  
  private employeeSubject = new BehaviorSubject<Employees | null>(null);
  private userSubject = new BehaviorSubject<Users | null>(null);
  private pinVerifiedSubject = new BehaviorSubject<boolean>(false);
  private returnUrlSubject = new BehaviorSubject<string>('/employee/dashboard');
  private inactivityTimer: any;
  private inactivityTimeoutMinutes = 0;
  private activityListenersAttached = false;
  
  public employee$ = this.employeeSubject.asObservable();
  public user$ = this.userSubject.asObservable();
  public pinVerified$ = this.pinVerifiedSubject.asObservable();
  public returnUrl$ = this.returnUrlSubject.asObservable();

  constructor(
    private http: HttpClient,
    private roleService: RoleService
  ) {
    this.loadStoredData();
  }

  // PIN Verification Status Management
  isPinVerified(): boolean {
    return this.pinVerifiedSubject.value;
  }

  setPinVerified(verified: boolean): void {
    this.pinVerifiedSubject.next(verified);
    if (verified) {
      localStorage.setItem('pin_verified', 'true');
    } else {
      localStorage.removeItem('pin_verified');
    }
  }

  private resetPinVerification(): void {
    this.pinVerifiedSubject.next(false);
    localStorage.removeItem('pin_verified');
  }

  // Return URL Management for post-PIN redirect
  setReturnUrl(url: string): void {
    this.returnUrlSubject.next(url);
    localStorage.setItem('return_url', url);
  }

  getReturnUrl(): string {
    return this.returnUrlSubject.value;
  }

  private loadReturnUrl(): void {
    const stored = localStorage.getItem('return_url');
    if (stored) {
      this.returnUrlSubject.next(stored);
    }
  }

  clearReturnUrl(): void {
    this.returnUrlSubject.next('/employee/dashboard');
    localStorage.removeItem('return_url');
  }

  // Employee Login
  loginEmployee(username: string, password: string): Observable<AuthResponse> {
    // Use unified login flow but prefer employee endpoint naming for clarity
    // We'll call the same unified login to reuse mapping and storage logic
    return this.login(username, password);
  }

  // User (Admin) Login
  loginUser(username: string, password: string): Observable<AuthResponse> {
    return this.login(username, password);
  }

  // Single unified login (preferred): backend returns access_token and a `user` object
  // Use generic { email, password } so the backend can try user then employee.
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<any>(`${this.API_URL}/login`, { email: username, password }).pipe(
      map((res: any) => {
        // Normalize server response into AuthResponse
        const authResp: AuthResponse = {
          token: res?.access_token || res?.token || null,
          refreshToken: res?.refresh_token || res?.refreshToken || null,
          userType: res?.user?.type || res?.userType || (res?.user && res.user.employee_type ? 'employee' : 'user'),
        } as AuthResponse;

        if (authResp.userType === 'employee' && res?.user) {
          authResp.employee = {
            id: res.user.id,
            employeeCode: res.user.employeeCode || '',
            firstName: res.user.firstName || '',
            lastName: res.user.lastName || '',
            gender: res.user.gender || 'Male',
            phone: res.user.phone || '',
            email: res.user.email || res.user.employeeEmail || '',
            city: res.user.city || '',
            employee_type: res.user.employee_type,
            jobTitle: res.user.jobTitle || '',
            pinTimeout: res.user.pinTimeout || 5,
            pin: '',
            password: '',
            createdAt: res.user.createdAt ? new Date(res.user.createdAt) : new Date(),
            updatedAt: res.user.updatedAt ? new Date(res.user.updatedAt) : new Date(),
            centerId: res.user.centerId || null,
            storeId: res.user.storeId || null,
            isCenterAdmin: res.user.isCenterAdmin || res.user.is_center_admin || false,
            appointments: [],
            isLocked: false
          } as any;
        }

        if (authResp.userType === 'user' && res?.user) {
          authResp.user = res.user as any;
        }

        return authResp;
      }),
      tap((response: AuthResponse) => {
        this.storeAuthData(response);

        if (response.employee) {
          this.employeeSubject.next(response.employee);
          this.resetPinVerification(); // Reset PIN verified state on new login
          if (response.employee.pinTimeout) {
            this.startInactivityTimer(response.employee.pinTimeout);
          }
        }

        if (response.user) {
          this.userSubject.next(response.user as any);
        }
      })
    );
  }

  // Verify Employee PIN - Enhanced version with proper typing
  verifyPin(pin: string): Observable<VerifyPinResponse> {
    const employee = this.employeeSubject.value;
    if (!employee) {
      return of({
        verified: false,
        access_token: '',
        error: 'No employee logged in'
      });
    }
    
    return this.http.post<VerifyPinResponse>(`${this.API_URL}/verify-pin`, {
      pin
    }).pipe(
      map((response: any) => {
        // Normalize response
        return {
          verified: response?.verified || false,
          access_token: response?.access_token || response?.token || '',
          refresh_token: response?.refresh_token || response?.refreshToken,
          user: response?.user || employee,
          userType: 'employee',
          message: response?.message,
          error: response?.error
        } as VerifyPinResponse;
      }),
      tap((response: VerifyPinResponse) => {
        if (response.verified && response.access_token) {
          // Update token with PIN-verified JWT
          this.storeNewToken({ accessToken: response.access_token });
          
          // Update employee data
          if (response.user) {
            const updatedEmployee = { ...employee, ...response.user };
            this.employeeSubject.next(updatedEmployee);
            localStorage.setItem(this.EMPLOYEE_DATA_KEY, JSON.stringify(updatedEmployee));
          }
          
          // Reset inactivity timer
          this.resetInactivityTimer();
        }
      }),
      catchError((error) => {
        return of({
          verified: false,
          access_token: '',
          error: error?.error?.message || 'PIN verification failed'
        } as VerifyPinResponse);
      })
    );
  }

  /**
   * Verificar si el login requiere PIN (es decir, si es un empleado)
   */
  requiresPinVerification(userType: 'employee' | 'user'): boolean {
    return userType === 'employee';
  }

  /**
   * Obtener el nombre completo del empleado para mostrar en el modal PIN
   */
  getEmployeeFullName(): string {
    const employee = this.employeeSubject.value;
    if (employee) {
      return `${employee.firstName} ${employee.lastName}`;
    }
    return '';
  }

  // Refresh Token (cookie-based): server reads httpOnly cookie; we must include credentials
  refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/refresh`, {}, { withCredentials: true }).pipe(
      map((res: any) => {
        return {
          accessToken: res?.access_token || res?.accessToken || null,
          refreshToken: res?.refresh_token || res?.refreshToken || null
        };
      }),
      tap((tokenData: any) => {
        this.storeNewToken(tokenData);
      })
    );
  }

  private storeAuthData(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    // refresh token is now stored in httpOnly cookie (set by server); do not store in localStorage
    localStorage.setItem(this.USER_TYPE_KEY, response.userType);
    
    // Clear return URL on new login - start fresh
    this.clearReturnUrl();
    
    if (response.employee) {
      localStorage.setItem(this.EMPLOYEE_DATA_KEY, JSON.stringify(response.employee));
    }
    if (response.user) {
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }
  }

  storeNewToken(tokenData: any): void {
    // Accept either { access_token, refresh_token } or { accessToken, refreshToken }
    const access = tokenData?.accessToken || tokenData?.access_token || tokenData?.token || tokenData?.auth_token;
    if (access) {
      localStorage.setItem(this.TOKEN_KEY, access);
    }
  }

  private loadStoredData(): void {
    const userType = localStorage.getItem(this.USER_TYPE_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);
    const pinVerified = localStorage.getItem('pin_verified') === 'true';
    
    if (token && userType === 'employee') {
      const employeeData = localStorage.getItem(this.EMPLOYEE_DATA_KEY);
      if (employeeData) {
        const employee: Employees = JSON.parse(employeeData);
        this.employeeSubject.next(employee);
        this.pinVerifiedSubject.next(pinVerified);
        this.loadReturnUrl();
        this.startInactivityTimer(employee.pinTimeout);
      }
    } else if (token && userType === 'user') {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user: Users = JSON.parse(userData);
          this.userSubject.next(user);
        } catch (e) {
          console.warn('Failed to parse stored user data', e);
        }
      }
      
    }
  }

  // Inactivity Management
  private startInactivityTimer(timeoutMinutes: number): void {
    this.inactivityTimeoutMinutes = timeoutMinutes;
    this.resetInactivityTimer();

    if (!this.activityListenersAttached) {
      this.setupActivityListeners();
      this.activityListenersAttached = true;
    }
  }

  private setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, () => this.resetInactivityTimer(), true);
    });
  }

  resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      this.inactivityTimer.unsubscribe();
    }

    const employee = this.employeeSubject.value;
    const timeoutMinutes = employee?.pinTimeout ?? this.inactivityTimeoutMinutes;
    if (timeoutMinutes && timeoutMinutes > 0) {
      this.inactivityTimer = timer(timeoutMinutes * 60 * 1000).subscribe(() => {
        this.lockSession();
      });
    }
  }

  lockSession(): void {
    const employee = this.employeeSubject.value;
    if (employee) {
      this.employeeSubject.next({ ...employee, isLocked: true });
      this.resetPinVerification(); // Reset PIN verified when session locks due to inactivity
      this.inactivityTimer?.unsubscribe();
    }
  }

  /**
   * Manual account lock (triggered by user clicking "Lock Account")
   */
  lockAccount(): void {
    const employee = this.employeeSubject.value;
    if (employee) {
      this.employeeSubject.next({ ...employee, isLocked: true });
      this.resetPinVerification(); // Reset PIN verified when manually locking
      this.inactivityTimer?.unsubscribe();
    }
  }

  unlockSession(pin: string): Observable<VerifyPinResponse> {
    return this.verifyPin(pin).pipe(
      tap(response => {
        if (response.verified) {
          const employee = this.employeeSubject.value;
          if (employee) {
            this.employeeSubject.next({ ...employee, isLocked: false });
            this.setPinVerified(true); // Mark PIN as verified after successful unlock
          }
        }
      })
    );
  }

  // Role-based Methods
  getCurrentEmployeeRole(): EmployeeType | null {
    const rol = this.employeeSubject.value?.employee_type || null;
    return rol as EmployeeType | null;
  }

  hasEmployeePermission(permission: keyof RolePermissions): boolean {
    const role = this.getCurrentEmployeeRole();
    return role ? this.roleService.hasPermission(role, permission) : false;
  }

  canAccessModule(module: string): boolean {
    const role = this.getCurrentEmployeeRole();
    return role ? this.roleService.canAccessModule(role, module) : false;
  }

  isAdminStore(): boolean {
    return this.getCurrentEmployeeRole() === EmployeeRole.ADMIN_STORE;
  }

  isAccountant(): boolean {
    return this.getCurrentEmployeeRole() === EmployeeRole.ACCOUNTANT;
  }

  isExpert(): boolean {
    return this.getCurrentEmployeeRole() === EmployeeRole.EXPERT;
  }

  // Session Data Getters
  getCurrentEmployee(): Employees | null {
    return this.employeeSubject.value;
  }

  getEmployeeId(): number | null {
    return this.employeeSubject.value?.id || null;
  }

  getCenterId(): number | null {
    return this.employeeSubject.value?.centerId || null;
  }

  getStoreId(): number | null {
    return this.employeeSubject.value?.storeId || null;
  }

  isEmployeeLocked(): boolean {
    return this.employeeSubject.value?.isLocked || false;
  }

  // Token Management
  logout(): void {
    // Call backend to revoke refresh token (cookie-based) and then clean client state
    try {
      this.http.post(`${this.API_URL}/logout`, {}, { withCredentials: true }).subscribe({
        next: () => this.cleanupLocalSession(),
        error: () => this.cleanupLocalSession(),
      });
    } catch (e) {
      // ensure cleanup even if request fails synchronously
      this.cleanupLocalSession();
    }
  }

  private cleanupLocalSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    // refresh token stored in httpOnly cookie; do not remove from localStorage
    localStorage.removeItem(this.USER_TYPE_KEY);
    localStorage.removeItem(this.EMPLOYEE_DATA_KEY);
    localStorage.removeItem('pin_verified');

    this.employeeSubject.next(null);
    this.userSubject.next(null);
    this.pinVerifiedSubject.next(false);

    if (this.inactivityTimer) {
      this.inactivityTimer.unsubscribe();
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserType(): 'employee' | 'user' | null {
    return localStorage.getItem(this.USER_TYPE_KEY) as 'employee' | 'user' | null;
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() >= exp;
    } catch (error) {
      return true;
    }
  }
}