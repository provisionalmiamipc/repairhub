import { Centers } from "./Centers";
import { Customers } from "./Customers";
import { Employees } from "./Employees";
import { PaymentTypes } from "./PaymentTypes";
import { SaleItems } from "./SaleItems";
import { Stores } from "./Stores";

export interface Sales {
  id: number;
  //centerid: number;
  //storeid: number;
  //createdByid: number;
  totalCost: string;
  totalPrice: number;
  //customerid: number;
  //paymentTypeid: number;
  totalDiscount: number;
  createdAt: Date;
  updatedAt: Date;
  cloused: boolean;
  canceled: boolean;
  saleItems?: SaleItems[];
  center?: Centers;
  createdBy?: Employees;
  customer?: Customers;
  paymentType?: PaymentTypes;
  store?: Stores;
}
