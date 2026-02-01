import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController revoke', () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;
  let mockRefreshService: Partial<RefreshTokenService> & any;
  let mockConfigService: Partial<ConfigService> & any;

  beforeEach(() => {
    mockAuthService = {};
    mockRefreshService = {
      findByToken: jest.fn(),
      revoke: jest.fn(),
      revokeAllForOwner: jest.fn(),
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

  it('revokes a specific refresh token when provided', async () => {
    const fakeRecord = { id: 42 };
    mockRefreshService.findByToken.mockResolvedValue(fakeRecord);

    const res = await controller.revoke({ refreshToken: 'abc' }, {} as any);

    expect(mockRefreshService.findByToken).toHaveBeenCalledWith('abc');
    expect(mockRefreshService.revoke).toHaveBeenCalledWith(42);
    expect(res).toEqual({ revoked: true });
  });

  it('revokes all tokens for authenticated user when revokeAll is true', async () => {
    const req: any = { user: { type: 'user', sub: 7 } };
    const res = await controller.revoke({ revokeAll: true }, req);

    expect(mockRefreshService.revokeAllForOwner).toHaveBeenCalledWith('user', 7);
    expect(res).toEqual({ revoked: true });
  });

  it('throws if neither refreshToken nor revokeAll provided', async () => {
    await expect(controller.revoke({}, {} as any)).rejects.toThrow();
  });
});
