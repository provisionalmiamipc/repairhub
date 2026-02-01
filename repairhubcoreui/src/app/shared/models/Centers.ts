import { Appointments } from "./Appointments";
import { Customers } from "./Customers";
import { DeviceBrands } from "./DeviceBrands";
import { Devices } from "./Devices";
import { Employees } from "./Employees";
import { InventoryMovements } from "./InventoryMovements";
import { Items } from "./Items";
import { ItemTypes } from "./ItemTypes";
import { Orders } from "./Orders";
import { OrdersItem } from "./OrdersItem";
import { PaymentTypes } from "./PaymentTypes";
import { RepairStatus } from "./RepairStatus";
import { SaleItems } from "./SaleItems";
import { Sales } from "./Sales";
import { ServiceOrderRequeste } from "./ServiceOrderRequeste";
import { ServiceOrders } from "./ServiceOrders";
import { ServiceTypes } from "./ServiceTypes";
import { SODiagnostic } from "./SODiagnostic";
import { SOItems } from "./SOItems";
import { SONotes } from "./SONotes";
import { Stores } from "./Stores";


export interface Centers {
  id: number;
  centerCode: string;
  centerName: string;
  country: string;
  address: string;
  zipCode: string;
  city: string;
  state: string;
  time_zone: string;
  email: string;
  phoneNumber: string;
  webSite: string;
  createdAt: Date;
  completion: Date;
  appointments?: Appointments[];
  customers?: Customers[];
  deviceBrands?: DeviceBrands[];
  devices?: Devices[];
  employees?: Employees[];
  inventoryMovements?: InventoryMovements[];
  itemTypes?: ItemTypes[];
  items?: Items[];
  orders?: Orders[];
  ordersItems?: OrdersItem[];
  paymentTypes?: PaymentTypes[];
  repairStatuses?: RepairStatus[];
  sODiagnostics?: SODiagnostic[];
  sOItems?: SOItems[];
  sONotes?: SONotes[];
  saleItems?: SaleItems[];
  sales?: Sales[];
  serviceOrderRequestes?: ServiceOrderRequeste[];
  serviceOrders?: ServiceOrders[];
  serviceTypes?: ServiceTypes[];
  stores?: Stores[];
}

export interface CentersFormsI {  
  centerName: string;
  country: string;
  address: string;
  zipCode: string;
  city: string;
  state: string;
  time_zone: string;
  email: string;
  phoneNumber: string;
  webSite: string;
  completionDate: Date;
  
}
