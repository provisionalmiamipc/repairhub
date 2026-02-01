import { TestBed } from '@angular/core/testing';
import { AppStateService } from './app-state.service';
import { AppState, UserSession } from './app-state.interface';

describe('AppStateService', () => {
  let service: AppStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppStateService],
    });
    service = TestBed.inject(AppStateService);
    // Limpiar localStorage antes de cada test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('State Management', () => {
    it('should provide initial state', (done) => {
      service.state$.subscribe((state) => {
        expect(state.user).toBeNull();
        expect(state.ui.sidebarCollapsed).toBe(false);
        expect(state.offline).toBe(false);
        done();
      });
    });

    it('should get current state snapshot', () => {
      const state = service.snapshot;
      expect(state).toBeTruthy();
      expect(state.ui).toBeTruthy();
    });
  });

  describe('Select Operations', () => {
    it('should select top-level state', (done) => {
      const mockUser: UserSession = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['ADMIN'],
        permissions: ['READ_ALL'],
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      service.set('user', mockUser);

      service.select<UserSession>('user').subscribe((user) => {
        expect(user).toEqual(mockUser);
        done();
      });
    });

    it('should select nested state', (done) => {
      service.setNested(['ui', 'theme'], 'dark');

      service.selectNested<string>(['ui', 'theme']).subscribe((theme) => {
        expect(theme).toBe('dark');
        done();
      });
    });

    it('should emit distinct values only', (done) => {
      let emitCount = 0;

      service.select<string>('offline').subscribe(() => {
        emitCount++;
      });

      service.set('offline', false);
      service.set('offline', false); // Should not emit again
      service.set('offline', true);

      setTimeout(() => {
        expect(emitCount).toBe(2); // Initial + 1 change
        done();
      }, 100);
    });
  });

  describe('Update Operations', () => {
    it('should update state', (done) => {
      const mockUser: UserSession = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['USER'],
        permissions: [],
        lastActivity: new Date(),
        expiresAt: new Date(),
      };

      service.update({ user: mockUser });

      service.state$.subscribe((state) => {
        expect(state.user).toEqual(mockUser);
        done();
      });
    });

    it('should set single property', (done) => {
      service.set('offline', true);

      service.select<boolean>('offline').subscribe((offline) => {
        expect(offline).toBe(true);
        done();
      });
    });

    it('should set nested property', (done) => {
      service.setNested(['ui', 'sidebarCollapsed'], true);

      service.selectNested<boolean>(['ui', 'sidebarCollapsed']).subscribe((collapsed) => {
        expect(collapsed).toBe(true);
        done();
      });
    });
  });

  describe('Reset Operations', () => {
    it('should reset to initial state', (done) => {
      const mockUser: UserSession = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['ADMIN'],
        permissions: ['READ_ALL'],
        lastActivity: new Date(),
        expiresAt: new Date(),
      };

      service.set('user', mockUser);
      service.reset();

      service.state$.subscribe((state) => {
        expect(state.user).toBeNull();
        expect(state.offline).toBe(false);
        done();
      });
    });

    it('should clear user session on logout', (done) => {
      const mockUser: UserSession = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['ADMIN'],
        permissions: [],
        lastActivity: new Date(),
        expiresAt: new Date(),
      };

      service.set('user', mockUser);
      service.clearUserSession();

      service.select<UserSession | null>('user').subscribe((user) => {
        expect(user).toBeNull();
        done();
      });
    });
  });

  describe('Filter Operations', () => {
    it('should save and retrieve filters', () => {
      const filters = { search: 'John', status: 'active' };

      service.saveFilter('customers', filters);

      const retrieved = service.getFilter('customers');
      expect(retrieved).toEqual(filters);
    });

    it('should get filters as Observable', (done) => {
      const filters = { search: 'test', page: 1 };

      service.saveFilter('orders', filters);

      service.getFilter$('orders').subscribe((retrieved) => {
        expect(retrieved).toEqual(filters);
        done();
      });
    });

    it('should clear module filters', () => {
      service.saveFilter('customers', { search: 'John' });
      service.saveFilter('orders', { status: 'pending' });

      service.clearFilter('customers');

      expect(service.getFilter('customers')).toEqual({});
      expect(service.getFilter('orders')).toEqual({ status: 'pending' });
    });
  });

  describe('Notification Operations', () => {
    it('should add success notification', (done) => {
      service.addNotification('success', 'Test message', 0);

      service.selectNested<any[]>(['ui', 'notifications']).subscribe((notifs) => {
        expect(notifs.length).toBe(1);
        expect(notifs[0].type).toBe('success');
        expect(notifs[0].message).toBe('Test message');
        done();
      });
    });

    it('should auto-remove notification after duration', (done) => {
      service.addNotification('info', 'Temporary', 100);

      setTimeout(() => {
        const notifs = service.snapshot.ui.notifications;
        expect(notifs.length).toBe(0);
        done();
      }, 150);
    });
  });

  describe('Storage Persistence', () => {
    it('should persist state to localStorage', () => {
      const mockUser: UserSession = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['ADMIN'],
        permissions: [],
        lastActivity: new Date(),
        expiresAt: new Date(),
      };

      service.set('user', mockUser);

      const stored = localStorage.getItem('appState');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.user?.email).toBe('test@example.com');
    });

    it('should persist offline state', () => {
      service.set('offline', true);

      const stored = localStorage.getItem('appState');
      const parsed = JSON.parse(stored!);
      expect(parsed.offline).toBe(true);
    });
  });
});
