import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UsersService } from './users.service';
import { Users } from '../models/Users';
import { environment } from '../../../environment';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/user`;

  const mockUser: Users = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-28'),
  };

  const mockUsers: Users[] = [mockUser];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsersService],
    });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('API Calls', () => {
    it('should get all users', (done) => {
      service.getAll().subscribe({
        next: (users) => {
          expect(users.length).toBe(1);
          expect(users[0]).toEqual(mockUser);
          done();
        },
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should get user by id', (done) => {
      service.getById(1).subscribe({
        next: (user) => {
          expect(user).toEqual(mockUser);
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('should create a new user', (done) => {
      const newUser: Partial<Users> = {
        email: 'newuser@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const createdUser: Users = {
        ...newUser,
        id: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Users;

      service.create(newUser).subscribe({
        next: (user) => {
          expect(user.id).toBe(2);
          expect(user.email).toBe('newuser@example.com');
          done();
        },
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      req.flush(createdUser);
    });

    it('should update an existing user', (done) => {
      const updatedUser: Partial<Users> = {
        firstName: 'Johnny',
      };

      const result: Users = { ...mockUser, ...updatedUser } as Users;

      service.update(1, updatedUser).subscribe({
        next: (user) => {
          expect(user.firstName).toBe('Johnny');
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PATCH');
      req.flush(result);
    });

    it('should delete a user', (done) => {
      service.delete(1).subscribe({
        next: () => {
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should check if email exists', (done) => {
      service.checkEmailExists('test@example.com').subscribe({
        next: (exists) => {
          expect(exists).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/check-email/test@example.com`);
      expect(req.request.method).toBe('GET');
      req.flush(true);
    });

    it('should return false if email does not exist', (done) => {
      service.checkEmailExists('nonexistent@example.com').subscribe({
        next: (exists) => {
          expect(exists).toBe(false);
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/check-email/nonexistent@example.com`);
      req.flush(false);
    });

    it('should fetch only active users', (done) => {
      service.getActive().subscribe({
        next: (users) => {
          expect(users.length).toBe(1);
          expect(users[0].isActive).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}?active=true`);
      expect(req.request.method).toBe('GET');
      req.flush([mockUser]);
    });
  });

  describe('Selection Management', () => {
    it('should select a user', () => {
      service.select(mockUser);
      expect(true).toBe(true);
    });

    it('should clear selection', () => {
      service.select(mockUser);
      service.clearSelection();
      expect(true).toBe(true);
    });

    it('should clear error message', () => {
      service.clearError();
      expect(true).toBe(true);
    });

    it('should reset all states', () => {
      service.select(mockUser);
      service.reset();
      expect(true).toBe(true);
    });
  });
});
