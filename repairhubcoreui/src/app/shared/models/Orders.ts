import { Centers } from "./Centers";
import { Customers } from "./Customers";
import { Employees } from "./Employees";
import { OrdersItem } from "./OrdersItem";
import { PaymentTypes } from "./PaymentTypes";
import { ServiceOrderRequeste } from "./ServiceOrderRequeste";
import { Stores } from "./Stores";

export interface Orders {
  id: number;
  //centerid: number;
  //storeid: number;
  totalPrice: number;
  totalCost: number;
  tax: number;
  advancePayment: number;
  //pymenTypeid: number;
  note: object;
  cloused: boolean;
  canceled: boolean;
  createdAt: Date;
  updatedAt: Date;
  //createdByid: number;
  center?: Centers;
  createdBy?: Employees;
  customer?: Customers;
  paymentType?: PaymentTypes;
  store?: Stores;
  ordersItems?: OrdersItem[];
  serviceOrderRequestes?: ServiceOrderRequeste[];
}
