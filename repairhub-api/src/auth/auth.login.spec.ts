import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController login cookie', () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;
  let mockRefreshService: Partial<RefreshTokenService> & any;
  let mockConfig: Partial<ConfigService> & any;

  beforeEach(() => {
    mockAuthService = {
      login: jest.fn().mockResolvedValue({ access_token: 'at', refresh_token: 'rt', user: { id: 1 } })
    } as any;
    mockRefreshService = {} as any;
    mockConfig = { get: jest.fn().mockImplementation((k: string) => {
      if (k === 'NODE_ENV') return 'test';
      if (k === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      return undefined;
    }) } as any;

    controller = new AuthController(mockAuthService as AuthService, mockRefreshService as RefreshTokenService, mockConfig as ConfigService);
  });

  it('sets httpOnly cookie and removes refresh_token from body', async () => {
    const res: any = { cookie: jest.fn() };
    const result = await controller.login({ email: 'a@b' , password: 'p' }, res);

    expect(mockAuthService.login).toHaveBeenCalledWith({ email: 'a@b', password: 'p' });
    expect(res.cookie).toHaveBeenCalled();
    // result should not include refresh_token
    expect((result as any).refresh_token).toBeUndefined();
    expect((result as any).access_token).toBe('at');
  });
});
