import { Centers } from "./Centers";
import { Orders } from "./Orders";
import { Sales } from "./Sales";
import { ServiceOrders } from "./ServiceOrders";
import { Stores } from "./Stores";

export interface PaymentTypes {
  id: number;
 // centerid: number;
 // storeid: number;
  type: string;
  description: string;
  createdAt: Date;
  orders?: Orders[];
  center?: Centers;
  store?: Stores;
  sales?: Sales[];
  serviceOrders?: ServiceOrders[];
}
