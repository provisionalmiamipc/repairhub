import { Controller, Post, Body, UseGuards, Request, BadRequestException, NotFoundException, Res, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ConfigService } from '@nestjs/config';
import { JwtEmployeeGuard } from "./guards/jwt-employee.guard";
import { JwtAnyGuard } from "./guards/jwt-any.guard";
import { RefreshTokenService } from './refresh-token.service';
// avoid importing express Response type directly to keep isolatedModules compatibility

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private refreshTokenService: RefreshTokenService, private configService: ConfigService) {}

  @Post('login/user')
  async loginUser(@Body() loginDto: { userEmail: string; password: string }, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.login(loginDto);
    this.maybeSetRefreshCookie(res, result?.refresh_token);
    if (result && (result as any).refresh_token) delete (result as any).refresh_token;
    return result;
  }

  @Post('login/employee')
  async loginEmployee(@Body() loginDto: { employeeEmail: string; password: string }, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.login(loginDto);
    this.maybeSetRefreshCookie(res, result?.refresh_token);
    if (result && (result as any).refresh_token) delete (result as any).refresh_token;
    return result;
  }

  @Post('login') // Endpoint universal - acepta { email, password } como forma unificada
  async login(@Body() loginDto: { email?: string; userEmail?: string; employeeEmail?: string; password: string }, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.login(loginDto);
    this.maybeSetRefreshCookie(res, result?.refresh_token);
    if (result && (result as any).refresh_token) delete (result as any).refresh_token;
    return result;
  }

  @Post('verify-pin')
  @UseGuards(JwtEmployeeGuard) // ← Requiere estar autenticado primero
  async verifyPin(@Body() verifyPinDto: { pin: string }, @Request() req) {
    const employeeId = req.user.employeeId;
    return this.authService.verifyPin(employeeId, verifyPinDto.pin);
  }

  @Post('refresh')
  async refresh(@Req() req: any, @Body() body: { refreshToken?: string }) {
    // Prefer explicit body token, fall back to cookie
    const token = body?.refreshToken || req?.cookies?.refreshToken;
    return this.authService.refresh(token as string);
  }

  private maybeSetRefreshCookie(res: any, token?: string) {
    if (!token || !res) return;
    const env = this.configService.get('NODE_ENV') || process.env.NODE_ENV || 'development';
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d';
    const maxAge = this.parseExpiresToMs(refreshExpiresIn);

    const cookieOptions: any = {
      httpOnly: true,
      secure: env === 'production',
      sameSite: 'lax',
      path: '/',
    };
    if (typeof maxAge === 'number') cookieOptions.maxAge = maxAge;

    try {
      res.cookie('refreshToken', token, cookieOptions);
    } catch (e) {
      // ignore
    }
  }

  private parseExpiresToMs(value: string | number): number | null {
    if (!value) return null;
    if (typeof value === 'number') return value * 1000;
    const s = String(value).trim();
    const last = s.slice(-1).toLowerCase();
    const num = parseInt(s.slice(0, -1), 10);
    if (!isNaN(num) && (last === 'd' || last === 'h' || last === 'm' || last === 's')) {
      if (last === 'd') return num * 24 * 60 * 60 * 1000;
      if (last === 'h') return num * 60 * 60 * 1000;
      if (last === 'm') return num * 60 * 1000;
      if (last === 's') return num * 1000;
    }
    const asNum = parseInt(s, 10);
    if (!isNaN(asNum)) return asNum * 1000;
    return null;
  }

  @Post('revoke')
  @UseGuards(JwtAnyGuard)
  async revoke(@Body() body: { refreshToken?: string; revokeAll?: boolean }, @Request() req) {
    // If revokeAll is requested, require authenticated user and revoke all tokens for that owner
    if (body.revokeAll) {
      const user = req?.user;
      if (!user || !user.type || !user.sub) {
        throw new BadRequestException('Authenticated user required to revoke all tokens');
      }

      const ownerType = user.type === 'user' ? 'user' : 'employee';
      const ownerId = Number(user.sub);
      await this.refreshTokenService.revokeAllForOwner(ownerType, ownerId);
      return { revoked: true };
    }

    // If a specific refresh token is provided, revoke only that one
    if (body.refreshToken) {
      const record = await this.refreshTokenService.findByToken(body.refreshToken);
      if (!record) throw new NotFoundException('Refresh token not found');
      await this.refreshTokenService.revoke(record.id);
      return { revoked: true };
    }

    throw new BadRequestException('refreshToken or revokeAll must be provided');
  }

  // Logout endpoint: revoke refresh token coming from httpOnly cookie (or body) and clear cookie
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any, @Body() body: { refreshToken?: string }) {
    // Try cookie first
    const cookieToken = req?.cookies?.refreshToken;
    const token = cookieToken || body.refreshToken;
    if (!token) throw new BadRequestException('No refresh token provided');

    const record = await this.refreshTokenService.findByToken(token);
    if (record) {
      await this.refreshTokenService.revoke(record.id);
    }

    // Clear cookie if present
    try {
      res.clearCookie('refreshToken');
    } catch (e) {
      // ignore
    }

    return { loggedOut: true };
  }
}