import { Centers } from "./Centers";
import { ServiceOrders } from "./ServiceOrders";
import { Stores } from "./Stores";

// AUTO-GENERATED
export interface DeviceBrands {
  id: number;
  centerId: number;
  storeId: number;
  name: string;
  img: string;
  description: string;
  createdAt: Date;
  center?: Centers;
  store?: Stores;
  serviceOrders?: ServiceOrders[];
}
