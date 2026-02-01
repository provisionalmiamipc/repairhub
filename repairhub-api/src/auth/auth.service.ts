import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { EmployeesService } from "../employees/employees.service";
import { UsersService } from "../user/user.service";
import { RefreshTokenService } from './refresh-token.service';
import * as crypto from 'crypto';



@Injectable()
export class AuthService {
    private readonly jwtUserService: JwtService;
    private readonly jwtEmployeeService: JwtService;

    constructor(
        private userService: UsersService,
        private employeeService: EmployeesService,
        private configService: ConfigService,
        private refreshTokenService: RefreshTokenService,
    ) {
        // JWT Service para Users
        this.jwtUserService = new JwtService({
            secret: this.configService.getOrThrow<string>('JWT_SECRET'),
            signOptions: {
                expiresIn: this.configService.get('JWT_EXPIRES_IN') || '1d'
            },
        });

        // JWT Service para Employees
        this.jwtEmployeeService = new JwtService({
            secret: this.configService.getOrThrow<string>('JWT_EMPLOYEE_SECRET'),
            signOptions: {
                expiresIn: this.configService.get('JWT_EMPLOYEE_EXPIRES_IN') || '1d'
            },
        });
    }

    // Validar User (Admin)
    async validateUser(email: string, password: string): Promise<any> {

        const user = await this.userService.findByEmail(email);

        if (user) {
            const isValidPassword = await this.userService.validatePassword(user, password);

            if (isValidPassword && user.isActive) {
                const { password, ...result } = user;
                return result;
            }
        }
        return null;
    }

    // Validar Employee
    async validateEmployee(employeeEmail: string, password: string): Promise<any> {
        const employee = await this.employeeService.findByEmail(employeeEmail);

        if (employee && await this.employeeService.validatePassword(employee, password) && employee.isActive) {
            const { password, ...result } = employee;
            return { ...result, type: 'employee' };
        }
        return null;
    }



    // Login para ambos tipos
    // credentials puede contener userEmail, employeeEmail o email (unificado)
    async login(credentials: { userEmail?: string; employeeEmail?: string; email?: string; password: string }) {

        //console.log('🔍 Login attempt:', credentials);

        let user: any = null;
        let type = '';

        // Priority: explicit userEmail > explicit employeeEmail > generic email (try user then employee)
        if (credentials.userEmail) {
            user = await this.validateUser(credentials.userEmail, credentials.password);
            type = 'user';
        } else if (credentials.employeeEmail) {
            user = await this.validateEmployee(credentials.employeeEmail, credentials.password);
            type = 'employee';
        } else if (credentials.email) {
            // Try user first
            user = await this.validateUser(credentials.email, credentials.password);
            if (user) {
                type = 'user';
            } else {
                // Try employee
                user = await this.validateEmployee(credentials.email, credentials.password);
                if (user) {
                    type = 'employee';
                }
            }
        }

        if (!user) {
            //console.log('❌ No user found or invalid password');
            throw new UnauthorizedException('Invalid credentials');
        }

        const jwtService = type === 'user' ? this.jwtUserService : this.jwtEmployeeService;

        const payload = type === 'user'
            ? { userEmail: user.email, sub: user.id, type: 'user' }
            : { employeeEmail: user.employeeEmail || user.email, sub: user.id, type: 'employee' };

    // access token (short-lived)
    const access_token = jwtService.sign(payload);

    // refresh token (opaque, stored hashed in DB)
    const plainRefresh = crypto.randomBytes(64).toString('hex');
    // compute expiresAt from config (support simple values like '7d', '24h', '3600s' or numeric seconds)
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d';
    const expiresAt = this.parseExpiresToDate(refreshExpiresIn);

    // persist hashed refresh token
    await this.refreshTokenService.create(type === 'user' ? 'user' : 'employee', user.id, plainRefresh, expiresAt);

        // normalize employee_type
    let employee_type_normalized: string | undefined = undefined;
        if (type === 'employee' && user.employee_type) {
            const raw = String(user.employee_type).trim();
            const allowed = ['Expert', 'Accountant', 'AdminStore'];
            employee_type_normalized = allowed.includes(raw) ? raw : 'Expert';
        }

        return {
            access_token,
            refresh_token: plainRefresh,
            user: {
                id: user.id,
                type: type,
                email: user.email || user.employeeEmail,
                // Si es employee incluimos su tipo concreto (employee_type)
                employee_type: employee_type_normalized,
                firstName: user.firstName,
                lastName: user.lastName,
                // Campos de localización para employees
                centerId: type === 'employee' ? user.centerId : undefined,
                storeId: type === 'employee' ? user.storeId : undefined,
                isCenterAdmin: type === 'employee' ? user.isCenterAdmin : undefined,
                pinTimeout: type === 'employee' ? (user.pinTimeout || 5) : undefined,
                pin: type === 'employee' ? user.pin : undefined, // ← Agregar PIN para employees
                expires_in: type === 'user' ? (this.configService.get('JWT_EXPIRES_IN') || '1d') : (this.configService.get('JWT_EMPLOYEE_EXPIRES_IN') || '1d')
            }
        };
    }

    async verifyPin(employeeId: number, pin: string): Promise<{ verified: boolean; access_token?: string; user?: any; message?: string }> {
        const employee = await this.employeeService.findOne(employeeId);

        if (!employee) {
            throw new UnauthorizedException('Employee not found');
        }

        // Comparación directa (PIN no es password, no está hasheado)
        const isValid = employee.pin === pin;

        if (!isValid) {
            return {
                verified: false,
                message: 'Invalid PIN'
            };
        }

        // PIN válido - generar nuevo access_token con estado verificado
        const payload = {
            employeeEmail: employee.email,
            sub: employee.id,
            type: 'employee',
            pinVerified: true
        };

        const access_token = this.jwtEmployeeService.sign(payload);

        return {
            verified: true,
            access_token,
            user: {
                id: employee.id,
                email: employee.email,
                firstName: employee.firstName,
                lastName: employee.lastName,
                employee_type: employee.employee_type,
                centerId: employee.centerId,
                storeId: employee.storeId,
                isCenterAdmin: employee.isCenterAdmin,
                pinTimeout: employee.pinTimeout || 5
            }
        };
    }

    // Refresh tokens: validate an opaque refresh token (DB) and issue new pair with rotation
    async refresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
        if (!refreshToken) {
            throw new UnauthorizedException('Missing refresh token');
        }

        // Find stored refresh token record by hash
        const record = await this.refreshTokenService.findByToken(refreshToken);
        if (!record) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (record.revoked) {
            throw new UnauthorizedException('Refresh token revoked');
        }

        if (record.expiresAt && record.expiresAt.getTime() < Date.now()) {
            // revoke the token for good measure
            await this.refreshTokenService.revoke(record.id);
            throw new UnauthorizedException('Refresh token expired');
        }

        // Determine owner and create new access token
        const ownerType = record.ownerType;
        const ownerId = record.ownerId;

        let jwtServiceToUse: JwtService;
        let payload: any;

        if (ownerType === 'user') {
            const u = await this.userService.findOne(ownerId);
            if (!u) throw new UnauthorizedException('User not found');
            jwtServiceToUse = this.jwtUserService;
            payload = { userEmail: u.email, sub: u.id, type: 'user' };
        } else {
            const e = await this.employeeService.findOne(ownerId);
            if (!e) throw new UnauthorizedException('Employee not found');
            jwtServiceToUse = this.jwtEmployeeService;
            payload = { employeeEmail: e.email, sub: e.id, type: 'employee' };
        }

        const newAccess = jwtServiceToUse.sign({ ...(payload || {}), refreshed: true });

        // rotate refresh token: create a new plain token, persist it, and revoke the old one
        const newPlain = crypto.randomBytes(64).toString('hex');
        const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d';
        const expiresAt = this.parseExpiresToDate(refreshExpiresIn);

        const newRecord = await this.refreshTokenService.create(ownerType === 'user' ? 'user' : 'employee', ownerId, newPlain, expiresAt);
        // mark old as revoked and point to new
        await this.refreshTokenService.revoke(record.id, newRecord.id);

        return { access_token: newAccess, refresh_token: newPlain };
    }

    // Helper to parse expire strings like '7d', '24h', '3600s' or numeric seconds
    private parseExpiresToDate(value: string | number): Date | null {
        if (!value) return null;
        if (typeof value === 'number') {
            return new Date(Date.now() + value * 1000);
        }
        const s = String(value).trim();
        const last = s.slice(-1).toLowerCase();
        const num = parseInt(s.slice(0, -1), 10);
        if (!isNaN(num) && (last === 'd' || last === 'h' || last === 'm' || last === 's')) {
            let ms = 0;
            if (last === 'd') ms = num * 24 * 60 * 60 * 1000;
            if (last === 'h') ms = num * 60 * 60 * 1000;
            if (last === 'm') ms = num * 60 * 1000;
            if (last === 's') ms = num * 1000;
            return new Date(Date.now() + ms);
        }
        // maybe it's a plain number in seconds
        const asNum = parseInt(s, 10);
        if (!isNaN(asNum)) return new Date(Date.now() + asNum * 1000);
        return null;
    }
}