import { Appointments } from "./Appointments";
import { Centers } from "./Centers";
import { Orders } from "./Orders";
import { Sales } from "./Sales";
import { ServiceOrders } from "./ServiceOrders";
import { Stores } from "./Stores";

export type Gender = "Male" | "Female";

export interface Customers {
  id: number;
  customerCode: string;
  centerId: number;
  storeId: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  gender: string;
  extraInfo: string | null;
  b2b: boolean;
  discount: number;
  createdAt: Date;
  updatedAt: Date;  
  center?: Centers;
  store?: Stores;
  orders?: Orders[];
  sales?: Sales[];
  serviceOrders?: ServiceOrders[];
}
