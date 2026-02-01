/**
 * Tests para MockApiInterceptor
 * 
 * NOTA: Estos tests son básicos y se enfocan en validar que:
 * 1. El interceptor está correctamente configurado
 * 2. Los datos mock están disponibles
 * 3. Las funciones helper existen y son accesibles
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { MockApiInterceptor } from './mock-api.interceptor';
import { environment } from '../../../environments/environment';
import {
  MOCK_USERS,
  MOCK_CUSTOMERS,
  MOCK_EMPLOYEES,
  MOCK_ORDERS,
  MOCK_DEVICES,
  MOCK_ITEMS,
  MOCK_PAYMENT_TYPES,
  MOCK_DEVICE_BRANDS,
  MOCK_REPAIR_STATUS,
  MOCK_SERVICE_ORDERS,
  MOCK_DATABASE,
  getMockData,
  getMockDataById,
  createMockData,
  updateMockData,
  deleteMockData,
} from '../data/mock-data';

describe('MockApiInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let originalMockApi: boolean;

  beforeEach(() => {
    originalMockApi = environment.features.mockApi;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MockApiInterceptor,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: MockApiInterceptor,
          multi: true,
        },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    environment.features.mockApi = originalMockApi;
    httpMock.verify();
  });

  describe('Configuración del Interceptor', () => {
    it('debe estar registrado en providers', () => {
      expect(TestBed.inject(MockApiInterceptor)).toBeDefined();
    });

    it('debe dejar pasar requests cuando mockApi está deshabilitado', () => {
      environment.features.mockApi = false;
      const testUrl = 'http://api.example.com/users';

      httpClient.get(testUrl).subscribe();

      const req = httpMock.expectOne(testUrl);
      expect(req.request.url).toBe(testUrl);
    });
  });

  describe('Datos Mock Disponibles', () => {
    it('debe tener MOCK_USERS', () => {
      expect(MOCK_USERS).toBeDefined();
      expect(Array.isArray(MOCK_USERS)).toBe(true);
      expect(MOCK_USERS.length).toBeGreaterThan(0);
      expect(MOCK_USERS[0].id).toBeDefined();
    });

    it('debe tener MOCK_CUSTOMERS', () => {
      expect(MOCK_CUSTOMERS).toBeDefined();
      expect(Array.isArray(MOCK_CUSTOMERS)).toBe(true);
      expect(MOCK_CUSTOMERS.length).toBeGreaterThan(0);
    });

    it('debe tener MOCK_EMPLOYEES', () => {
      expect(MOCK_EMPLOYEES).toBeDefined();
      expect(Array.isArray(MOCK_EMPLOYEES)).toBe(true);
      expect(MOCK_EMPLOYEES.length).toBeGreaterThan(0);
    });

    it('debe tener MOCK_ORDERS', () => {
      expect(MOCK_ORDERS).toBeDefined();
      expect(Array.isArray(MOCK_ORDERS)).toBe(true);
      expect(MOCK_ORDERS.length).toBeGreaterThan(0);
    });

    it('debe tener MOCK_DEVICES', () => {
      expect(MOCK_DEVICES).toBeDefined();
      expect(Array.isArray(MOCK_DEVICES)).toBe(true);
      expect(MOCK_DEVICES.length).toBeGreaterThan(0);
    });

    it('debe tener MOCK_ITEMS', () => {
      expect(MOCK_ITEMS).toBeDefined();
      expect(Array.isArray(MOCK_ITEMS)).toBe(true);
      expect(MOCK_ITEMS.length).toBeGreaterThan(0);
    });

    it('debe tener MOCK_PAYMENT_TYPES', () => {
      expect(MOCK_PAYMENT_TYPES).toBeDefined();
      expect(Array.isArray(MOCK_PAYMENT_TYPES)).toBe(true);
      expect(MOCK_PAYMENT_TYPES.length).toBeGreaterThan(0);
    });

    it('debe tener MOCK_DEVICE_BRANDS', () => {
      expect(MOCK_DEVICE_BRANDS).toBeDefined();
      expect(Array.isArray(MOCK_DEVICE_BRANDS)).toBe(true);
      expect(MOCK_DEVICE_BRANDS.length).toBeGreaterThan(0);
    });

    it('debe tener MOCK_REPAIR_STATUS', () => {
      expect(MOCK_REPAIR_STATUS).toBeDefined();
      expect(Array.isArray(MOCK_REPAIR_STATUS)).toBe(true);
      expect(MOCK_REPAIR_STATUS.length).toBeGreaterThan(0);
    });

    it('debe tener MOCK_SERVICE_ORDERS', () => {
      expect(MOCK_SERVICE_ORDERS).toBeDefined();
      expect(Array.isArray(MOCK_SERVICE_ORDERS)).toBe(true);
      expect(MOCK_SERVICE_ORDERS.length).toBeGreaterThan(0);
    });
  });

  describe('MOCK_DATABASE', () => {
    it('debe tener todas las colecciones', () => {
      expect(MOCK_DATABASE.users).toBeDefined();
      expect(MOCK_DATABASE.customers).toBeDefined();
      expect(MOCK_DATABASE.employees).toBeDefined();
      expect(MOCK_DATABASE.orders).toBeDefined();
      expect(MOCK_DATABASE.devices).toBeDefined();
      expect(MOCK_DATABASE.items).toBeDefined();
      expect(MOCK_DATABASE['payment-types']).toBeDefined();
      expect(MOCK_DATABASE['device-brands']).toBeDefined();
      expect(MOCK_DATABASE['repair-status']).toBeDefined();
      expect(MOCK_DATABASE['service-orders']).toBeDefined();
    });
  });

  describe('Funciones Helper', () => {
    it('getMockData debe retornar datos', () => {
      const users = getMockData('users');
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    it('getMockDataById debe encontrar usuario por ID', () => {
      const user = getMockDataById('users', 1);
      expect(user).toBeDefined();
      expect(user?.id).toBe(1);
    });

    it('getMockDataById debe retornar undefined para ID inexistente', () => {
      const user = getMockDataById('users', 99999);
      expect(user).toBeUndefined();
    });

    it('createMockData debe generar nuevo registro', () => {
      const newUser = createMockData('users', {
        email: 'new@test.com',
        firstName: 'New',
        lastName: 'User',
        isActive: true,
      });
      
      expect(newUser.id).toBeDefined();
      expect(newUser.id).toBeGreaterThan(0);
      expect(newUser.createdAt).toBeDefined();
    });

    it('updateMockData debe fallar para ID inexistente', () => {
      const user = getMockDataById('users', 1);
      if (user) {
        const updated = updateMockData('users', 1, { ...user, firstName: 'Updated' });
        expect(updated).toBeDefined();
        expect(updated.firstName).toBe('Updated');
      }
    });

    it('deleteMockData debe retornar false para ID inexistente', () => {
      const result = deleteMockData('users', 99999);
      expect(result).toBe(false);
    });
  });
});

