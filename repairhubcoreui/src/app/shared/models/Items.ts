import { Centers } from "./Centers";
import { InventoryMovements } from "./InventoryMovements";
import { ItemTypes } from "./ItemTypes";
import { OrdersItem } from "./OrdersItem";
import { SaleItems } from "./SaleItems";
import { SOItems } from "./SOItems";
import { Stores } from "./Stores";

// AUTO-GENERATED
export interface Items {
  id: number;
  centerid: number;
  storeid: number;
  product: string;
  sku: string;
  price: number;
  cost: number;
  itemTypeId: number;
  shortTitleDesc: string;
  stock: number;
  minimunStock: number;
  specs: object;
  image: string;
  barcode: string;
  taxable: boolean;
  warranty: number;
  discount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  inventoryMovements?: InventoryMovements[];
  center?: Centers;
  store?: Stores;
  type?: ItemTypes;
  ordersItems?: OrdersItem[];
  sOItems?: SOItems[];
  saleItems?: SaleItems[];
}
