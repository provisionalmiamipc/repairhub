import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController logout', () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;
  let mockRefreshService: Partial<RefreshTokenService> & any;
  let mockConfigService: Partial<ConfigService> & any;

  beforeEach(() => {
    mockAuthService = {};
    mockRefreshService = {
      findByToken: jest.fn(),
      revoke: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'test';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        return undefined;
      }),
    } as any;

    controller = new AuthController(
      mockAuthService as AuthService,
      mockRefreshService as RefreshTokenService,
      mockConfigService as ConfigService,
    );
  });

  it('revokes token from cookie and clears cookie', async () => {
    const fakeRecord = { id: 9 };
    mockRefreshService.findByToken.mockResolvedValue(fakeRecord);

    const req: any = { cookies: { refreshToken: 'abc' } };
    const res: any = { clearCookie: jest.fn() };

    const resBody = await controller.logout(req, res, {} as any);

    expect(mockRefreshService.findByToken).toHaveBeenCalledWith('abc');
    expect(mockRefreshService.revoke).toHaveBeenCalledWith(9);
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
    expect(resBody).toEqual({ loggedOut: true });
  });

  it('revokes token from body when cookie missing', async () => {
    const fakeRecord = { id: 10 };
    mockRefreshService.findByToken.mockResolvedValue(fakeRecord);

    const req: any = { cookies: {} };
    const res: any = { clearCookie: jest.fn() };

    const resBody = await controller.logout(req, res, { refreshToken: 'bodyToken' } as any);

    expect(mockRefreshService.findByToken).toHaveBeenCalledWith('bodyToken');
    expect(mockRefreshService.revoke).toHaveBeenCalledWith(10);
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
    expect(resBody).toEqual({ loggedOut: true });
  });

  it('throws if no token provided', async () => {
    const req: any = { cookies: {} };
    const res: any = { clearCookie: jest.fn() };

    await expect(controller.logout(req, res, {} as any)).rejects.toThrow();
  });
});
