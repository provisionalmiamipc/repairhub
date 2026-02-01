import { Centers } from "./Centers";
import { Employees } from "./Employees";
import { ServiceOrders } from "./ServiceOrders";
import { Stores } from "./Stores";

export interface RepairStatus {
  id: number;
  centerId: number;
  storeId: number;
  status: string;
  serviceOrderId: number;
  createdAt: Date;
  createdById: number;
  center?: Centers;
  employee?: Employees;
  serviceOrder?: ServiceOrders;
  store?: Stores;
}
