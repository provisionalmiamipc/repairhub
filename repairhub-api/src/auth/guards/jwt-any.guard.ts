import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAnyGuard extends AuthGuard(['jwt-user', 'jwt-employee']) {}