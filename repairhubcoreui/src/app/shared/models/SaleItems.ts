import { Centers } from "./Centers";
import { Items } from "./Items";
import { Sales } from "./Sales";
import { Stores } from "./Stores";

export interface SaleItems {
  id: number;
  //centerid: number;
  //storeid: number;
  //saleid: number;
  //itemid: number;
  quantity: number;
  cost: number;
  price: number;
  discount: number;
  createdAt: Date;
  updatedAt: Date;
  center?: Centers;
  item?: Items;
  sale?: Sales;
  store?: Stores;
}
