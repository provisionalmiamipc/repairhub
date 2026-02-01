import { Centers } from "./Centers";
import { Employees } from "./Employees";
import { ServiceOrders } from "./ServiceOrders";
import { Stores } from "./Stores";

export interface SONotes {
  id: number;
  centerId: number;
  storeId: number;
  serviceOrderId: number;
  note: string;
  createdAt: Date;
  createdById: number;
  center?: Centers;
  employee: Employees;
  serviceOrder?: ServiceOrders;
  store?: Stores;
}
