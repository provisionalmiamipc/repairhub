import { Appointments } from "./Appointments";
import { Centers } from "./Centers";
import { Stores } from "./Stores";

export interface ServiceTypes {
  id: number;
  centerId: number;
  storeId: number;
  name: string;
  description: string;
  createdAt: Date;
  appointments?: Appointments[];
  center?: Centers;
  store?: Stores;
}
