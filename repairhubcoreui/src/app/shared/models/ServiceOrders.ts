import { Centers } from "./Centers";
import { Customers } from "./Customers";
import { DeviceBrands } from "./DeviceBrands";
import { Devices } from "./Devices";
import { Employees } from "./Employees";
import { PaymentTypes } from "./PaymentTypes";
import { RepairStatus } from "./RepairStatus";
import { ServiceOrderRequeste } from "./ServiceOrderRequeste";
import { SODiagnostic } from "./SODiagnostic";
import { SOItems } from "./SOItems";
import { SONotes } from "./SONotes";
import { Stores } from "./Stores";
import { ReceivedPart } from './ReceivedPart';
import { Warranty, WarrantyDurationUnit } from './Warranty';

export type WarrantyDecision = 'pending' | 'approved' | 'rejected';

export interface LastRepairStatus {
  id: number;
  status: string;
  date: Date;
}

export interface ServiceOrderImage {
  id: number;
  ownerType: string;
  ownerId: number;
  status: 'pending' | 'processing' | 'ready' | 'failed' | 'deleted';
  originalName: string;
  mimeType?: string;
  displaySize?: number;
  thumbnailSize?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  displayUrl?: string;
  error?: string | null;
}

export interface ServiceOrders {
  id: number;
  orderCode: string;
  centerId: number;
  storeId: number;
  customerId: number;
  deviceId: number;
  deviceBrandId: number;
  model: string;
  defectivePart: string;
  serial: string;
  lock: boolean;
  price: number;
  repairCost: number;
  totalCost: number;
  costdiscount: number;
  advancePayment: number;
  tax: number;
  paymentTypeId: number;
  assignedTechId: number;
  createdById: number;
  noteReception: string;
  warrantyDuration: number;
  warrantyDurationUnit: WarrantyDurationUnit;
  estimated: string;
  isWarrantyOrder?: boolean;
  originalServiceOrderId?: number | null;
  warrantyId?: number | null;
  warrantyDecision?: WarrantyDecision | null;
  warrantyDecisionReason?: string | null;
  cloused: boolean;
  canceled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastRepairStatus?: LastRepairStatus | null;
  repairStatus?: RepairStatus[];
  repairStatuses?: RepairStatus[];
  sODiagnostics?: SODiagnostic[];
  sOItems?: SOItems[];
  sONotes?: SONotes[];
  serviceOrderRequestes?: ServiceOrderRequeste[];
  receivedParts?: ReceivedPart[];
  warranties?: Warranty[];
  warranty?: Warranty;
  originalServiceOrder?: ServiceOrders;
  center?: Centers;
  assignedTech?: Employees;
  customer?: Customers;
  deviceBrand?: DeviceBrands;
  device?: Devices;
  employee?: Employees;
  paymentType?: PaymentTypes;
  store?: Stores;
  images?: ServiceOrderImage[];
}
