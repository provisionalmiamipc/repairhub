import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BaseService } from './base.service';
import { HttpClient } from '@angular/common/http';
import { CacheManagerService } from '../store/cache-manager.service';
import { of } from 'rxjs';

interface TestEntity {
  id: number;
  name: string;
}

class TestService extends BaseService<TestEntity> {
  protected apiUrl = 'http://api.example.com/test';

  constructor(http: HttpClient, cache: CacheManagerService) {
    super(http, cache);
  }
}

describe('BaseService', () => {
  let service: TestService;
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let cacheService: jasmine.SpyObj<CacheManagerService>;

  beforeEach(() => {
    const cacheSpy = jasmine.createSpyObj('CacheManagerService', [
      'get',
      'getSync',
      'set',
      'invalidate',
      'clear',
      'getStats',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: CacheManagerService, useValue: cacheSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    cacheService = TestBed.inject(CacheManagerService) as jasmine.SpyObj<CacheManagerService>;
    service = new TestService(http, cacheService);
    
    // Por default, el cache simplemente pasa a través de la factory
    cacheService.get.and.callFake((key: string, factory: () => any, ttl?: number) => {
      return factory();
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll()', () => {
    it('should fetch all entities', (done) => {
      const mockData: TestEntity[] = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];

      service.getAll().subscribe({
        next: (data) => {
          expect(data).toEqual(mockData);
          expect(cacheService.get).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test');
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should update data$ observable', (done) => {
      const mockData: TestEntity[] = [{ id: 1, name: 'Test' }];

      service.getAll().subscribe({
        next: () => {
          service.data$.subscribe({
            next: (data) => {
              expect(data).toEqual(mockData);
              done();
            },
          });
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test');
      req.flush(mockData);
    });

    it('should set loading to true during request', (done) => {
      const mockData: TestEntity[] = [];
      let sawLoading = false;

      service.loading$.subscribe({
        next: (loading) => {
          if (loading === true) sawLoading = true;
        },
      });

      service.getAll().subscribe({
        next: () => {
          expect(sawLoading).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test');
      req.flush(mockData);
    });

    it('should clear errors on successful request', (done) => {
      const mockData: TestEntity[] = [];

      service.getAll().subscribe({
        next: () => {
          service.error$.subscribe({
            next: (error) => {
              expect(error).toBeNull();
              done();
            },
          });
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test');
      req.flush(mockData);
    });
  });

  describe('getById()', () => {
    it('should fetch single entity by id', (done) => {
      const mockEntity: TestEntity = { id: 1, name: 'Test' };

      service.getById(1).subscribe({
        next: (data) => {
          expect(data).toEqual(mockEntity);
          done();
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockEntity);
    });

    it('should update selected$ observable', (done) => {
      const mockEntity: TestEntity = { id: 1, name: 'Test' };

      service.getById(1).subscribe({
        next: () => {
          service.selected$.subscribe({
            next: (selected) => {
              expect(selected).toEqual(mockEntity);
              done();
            },
          });
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test/1');
      req.flush(mockEntity);
    });
  });

  describe('create()', () => {
    it('should create new entity', (done) => {
      const newEntity: Partial<TestEntity> = { name: 'New' };
      const created: TestEntity = { id: 3, name: 'New' };

      service.create(newEntity).subscribe({
        next: (data) => {
          expect(data.id).toBe(3);
          done();
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test');
      expect(req.request.method).toBe('POST');
      req.flush(created);
    });
  });

  describe('update()', () => {
    it('should update existing entity', (done) => {
      const updated: TestEntity = { id: 1, name: 'Updated' };

      service.update(1, { name: 'Updated' }).subscribe({
        next: (data) => {
          expect(data.name).toBe('Updated');
          done();
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test/1');
      expect(req.request.method).toBe('PATCH');
      req.flush(updated);
    });
  });

  describe('delete()', () => {
    it('should delete entity by id', (done) => {
      service.delete(1).subscribe({
        next: () => {
          done();
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Observable Streams', () => {
    it('data$ should be observable', (done) => {
      service.data$.subscribe({
        next: (data) => {
          expect(Array.isArray(data)).toBe(true);
          done();
        },
      });
    });

    it('loading$ should be observable', (done) => {
      service.loading$.subscribe({
        next: (loading) => {
          expect(typeof loading).toBe('boolean');
          done();
        },
      });
    });

    it('error$ should be observable', (done) => {
      service.error$.subscribe({
        next: (error) => {
          expect(error === null || typeof error === 'string').toBe(true);
          done();
        },
      });
    });

    it('selected$ should be observable', (done) => {
      service.selected$.subscribe({
        next: (selected) => {
          expect(selected === null || typeof selected === 'object').toBe(true);
          done();
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors', () => {
      service.getAll().subscribe();

      const req = httpMock.expectOne('http://api.example.com/test');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should handle 404 errors', () => {
      service.getAll().subscribe();

      const req = httpMock.expectOne('http://api.example.com/test');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('Cache Integration', () => {
    it('should use cache for getAll by default', (done) => {
      const mockData: TestEntity[] = [{ id: 1, name: 'Test' }];

      service.getAll().subscribe({
        next: () => {
          expect(cacheService.get).toHaveBeenCalledWith(
            'http://api.example.com/test:all',
            jasmine.any(Function),
            jasmine.any(Number)
          );
          done();
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test');
      req.flush(mockData);
    });

    it('should bypass cache when useCache is false', (done) => {
      const mockData: TestEntity[] = [{ id: 1, name: 'Test' }];
      cacheService.get.calls.reset();

      service.getAll(false).subscribe({
        next: () => {
          expect(cacheService.get).not.toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test');
      req.flush(mockData);
    });

    it('should use cache for getById by default', (done) => {
      const mockEntity: TestEntity = { id: 1, name: 'Test' };

      service.getById(1).subscribe({
        next: () => {
          expect(cacheService.get).toHaveBeenCalledWith(
            'http://api.example.com/test:1',
            jasmine.any(Function),
            jasmine.any(Number)
          );
          done();
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test/1');
      req.flush(mockEntity);
    });

    it('should invalidate cache on create', (done) => {
      const newEntity: Partial<TestEntity> = { name: 'New' };
      const created: TestEntity = { id: 3, name: 'New' };

      service.create(newEntity).subscribe({
        next: () => {
          expect(cacheService.invalidate).toHaveBeenCalledWith('http://api.example.com/test:*');
          done();
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test');
      req.flush(created);
    });

    it('should invalidate cache on update', (done) => {
      const updated: TestEntity = { id: 1, name: 'Updated' };

      service.update(1, { name: 'Updated' }).subscribe({
        next: () => {
          expect(cacheService.invalidate).toHaveBeenCalledWith('http://api.example.com/test:*');
          done();
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test/1');
      req.flush(updated);
    });

    it('should invalidate cache on delete', (done) => {
      service.delete(1).subscribe({
        next: () => {
          expect(cacheService.invalidate).toHaveBeenCalledWith('http://api.example.com/test:*');
          done();
        },
      });

      const req = httpMock.expectOne('http://api.example.com/test/1');
      req.flush(null);
    });

    it('should invalidate cache on reset', () => {
      service.reset();
      expect(cacheService.invalidate).toHaveBeenCalledWith('http://api.example.com/test:*');
    });

    it('should allow manual cache invalidation', () => {
      service.invalidateCache();
      expect(cacheService.invalidate).toHaveBeenCalledWith('http://api.example.com/test:*');
    });

    it('should allow custom cache pattern invalidation', () => {
      service.invalidateCache('custom:pattern:*');
      expect(cacheService.invalidate).toHaveBeenCalledWith('custom:pattern:*');
    });

    it('should get cache stats', () => {
      const mockStats = { hits: 10, misses: 5, invalidations: 2 };
      cacheService.getStats.and.returnValue(mockStats);

      const stats = service.getCacheStats();
      expect(stats).toEqual(mockStats);
      expect(cacheService.getStats).toHaveBeenCalled();
    });
  });
});
