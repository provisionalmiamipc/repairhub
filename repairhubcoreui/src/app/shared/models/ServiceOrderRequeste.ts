import { Centers } from "./Centers";
import { Orders } from "./Orders";
import { ServiceOrders } from "./ServiceOrders";
import { Stores } from "./Stores";

export interface ServiceOrderRequeste {
  id: number;
  //centerid: number;
  //storeid: number;
  //serviceOrderid: number;
  //orderid: number;
  status: string;
  cloused: boolean;
  canceled: boolean;
  createdAt: Date;
  updatedAt: Date;
  center?: Centers;
  order?: Orders;
  serviceOrder?: ServiceOrders;
  store?: Stores;
}
