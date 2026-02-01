import { Centers } from "./Centers";
import { Employees } from "./Employees";
import { Items } from "./Items";
import { Orders } from "./Orders";
import { Stores } from "./Stores";

export interface OrdersItem {
  id: number;
  //centerid: number;
  //storeid: number;
  //orderid: number;
  //itemid: number;
  quantity: number;
  cost: number;
  price: number;
  discount: number;
  image: string;
  link: string;
  condition: string;
  received: boolean;
  note: object;
  createdAt: Date;
  updatedAt: Date;
  //createdByid: number;
  center?: Centers;
  createdBy?: Employees;
  item?: Items;
  order?: Orders;
  store?: Stores;
}
