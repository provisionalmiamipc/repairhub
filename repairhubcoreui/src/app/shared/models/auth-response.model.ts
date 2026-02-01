import { Employees } from "./Employees";
import { Users } from "./Users";

export interface AuthResponse {
  token: string;
  refreshToken: string;
  userType: 'employee' | 'user';
  employee?: Employees;
  user?: Users;
}