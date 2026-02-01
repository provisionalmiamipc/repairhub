import { Centers } from "./Centers";
import { Items } from "./Items";
import { Stores } from "./Stores";

export interface ItemTypes {
  id: number;
  // centerid: number;
  //storeid: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  center?: Centers;
  store?: Stores;
  items?: Items[];
}
