import { Appointments } from "./Appointments";
import { Centers } from "./Centers";
import { ServiceOrders } from "./ServiceOrders";
import { Stores } from "./Stores";

// AUTO-GENERATED
export interface Devices {
  id: number;
  centerId: number;
  storeId: number;
  name: string;
  description: string;
  createdAt: Date;
  appointments?: Appointments[];
  center?: Centers;
  store?: Stores;
  serviceOrders?: ServiceOrders[];
}
