import { TestBed } from '@angular/core/testing';
import { CacheManagerService } from './cache-manager.service';
import { of, throwError } from 'rxjs';

describe('CacheManagerService', () => {
  let service: CacheManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CacheManagerService],
    });
    service = TestBed.inject(CacheManagerService);
    service.clear();
  });

  afterEach(() => {
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Cache Operations', () => {
    it('should cache data and return from cache on second call', (done) => {
      const data = { id: 1, name: 'Test' };
      let callCount = 0;

      const source$ = () => {
        callCount++;
        return of(data);
      };

      // Primera llamada - cache miss
      service.get('test_key', source$, 5000).subscribe((result) => {
        expect(result).toEqual(data);
        expect(callCount).toBe(1);

        // Segunda llamada - cache hit
        service.get('test_key', source$, 5000).subscribe((result2) => {
          expect(result2).toEqual(data);
          expect(callCount).toBe(1); // No debe llamar de nuevo
          done();
        });
      });
    });

    it('should not cache if TTL expires', (done) => {
      const data = { id: 1 };
      let callCount = 0;

      const source$ = () => {
        callCount++;
        return of(data);
      };

      service.get('test_key', source$, 100).subscribe(() => {
        // Esperar a que expire TTL
        setTimeout(() => {
          service.get('test_key', source$, 100).subscribe(() => {
            expect(callCount).toBe(2);
            done();
          });
        }, 150);
      });
    });

    it('should set and get sync', () => {
      const data = { id: 1, name: 'Sync' };

      service.set('sync_key', data, 5000);

      const cached = service.getSync('sync_key');
      expect(cached).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      const result = service.getSync('non_existent');
      expect(result).toBeNull();
    });
  });

  describe('Invalidation', () => {
    it('should invalidate exact key', () => {
      service.set('users_1', { id: 1 }, 5000);
      service.set('users_2', { id: 2 }, 5000);

      const count = service.invalidate('users_1');

      expect(count).toBe(1);
      expect(service.getSync('users_1')).toBeNull();
      expect(service.getSync('users_2')).not.toBeNull();
    });

    it('should invalidate by pattern', () => {
      service.set('users_1', { id: 1 }, 5000);
      service.set('users_2', { id: 2 }, 5000);
      service.set('orders_1', { id: 1 }, 5000);

      const count = service.invalidate('users_*');

      expect(count).toBe(2);
      expect(service.getSync('users_1')).toBeNull();
      expect(service.getSync('users_2')).toBeNull();
      expect(service.getSync('orders_1')).not.toBeNull();
    });

    it('should clear all cache', () => {
      service.set('key1', { data: 1 }, 5000);
      service.set('key2', { data: 2 }, 5000);

      service.clear();

      expect(service.getSync('key1')).toBeNull();
      expect(service.getSync('key2')).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should track hit and miss stats', (done) => {
      const source$ = () => of({ data: 'test' });

      service.get('key1', source$, 5000).subscribe(() => {
        const stats1 = service.getStats();
        expect(stats1.misses).toBe(1);
        expect(stats1.hits).toBe(0);

        service.get('key1', source$, 5000).subscribe(() => {
          const stats2 = service.getStats();
          expect(stats2.hits).toBe(1);
          expect(stats2.misses).toBe(1);
          done();
        });
      });
    });

    it('should track invalidations', () => {
      service.set('key1', { data: 1 }, 5000);
      service.set('key2', { data: 2 }, 5000);

      service.invalidate('key*');

      const stats = service.getStats();
      expect(stats.invalidations).toBe(2);
    });
  });

  describe('Deduplication', () => {
    it('should reuse ongoing requests', (done) => {
      let callCount = 0;

      const source$ = () => {
        callCount++;
        return of({ data: 'test' });
      };

      // Hacer dos llamadas simultáneamente
      let completed = 0;

      service.get('dedup_key', source$, 5000).subscribe(() => {
        completed++;
        if (completed === 2) {
          expect(callCount).toBe(1); // Solo una llamada al source
          done();
        }
      });

      service.get('dedup_key', source$, 5000).subscribe(() => {
        completed++;
        if (completed === 2) {
          expect(callCount).toBe(1);
          done();
        }
      });
    });
  });
});
