import { Centers } from "./Centers";
import { Employees } from "./Employees";
import { Items } from "./Items";
import { ServiceOrders } from "./ServiceOrders";
import { Stores } from "./Stores";

export interface SOItems {
  id: number;
  centerId: number;
  storeId: number;
  serviceOrderId: number;
  itemId: number;
  quantity: number;
  cost: number;
  price: number;
  discount: number;
  note: string;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
  center?: Centers;
  employee?: Employees;
  item?: Items;
  serviceOrder?: ServiceOrders;
  store?: Stores;
}
