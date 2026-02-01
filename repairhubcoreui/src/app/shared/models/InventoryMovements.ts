import { Centers } from "./Centers";
import { Employees } from "./Employees";
import { Items } from "./Items";
import { Stores } from "./Stores";

export interface InventoryMovements {
  id: number;
  //centerid: number;
  //storeid: number;
  quantity: number;
  movementType: "Incoming" | "Outgoing";
  description: string;
  //createdByid: number;
  createdAt: Date;
  center?: Centers;
  createdBy?: Employees;
  item?: Items;
  store?: Stores;
}
