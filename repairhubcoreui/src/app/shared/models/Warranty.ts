import { Centers } from './Centers';
import { Customers } from './Customers';
import { Devices } from './Devices';
import { Employees } from './Employees';
import { ServiceOrders } from './ServiceOrders';
import { Stores } from './Stores';

export type WarrantyDurationUnit = 'days' | 'months' | 'years';
export type WarrantyStatus = 'active' | 'expired' | 'void';

export interface Warranty {
  id: number;
  centerId: number;
  storeId: number;
  serviceOrderId: number;
  customerId: number;
  deviceId: number;
  serial?: string;
  status: WarrantyStatus;
  warrantyDuration: number;
  warrantyDurationUnit: WarrantyDurationUnit;
  warrantyStartDate: string | Date;
  warrantyEndDate: string | Date;
  coverageSummary?: string;
  warrantyVoidReason?: string;
  warrantyVoidNotes?: string;
  createdById?: number | null;
  voidedById?: number | null;
  voidedAt?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  center?: Centers;
  store?: Stores;
  serviceOrder?: ServiceOrders;
  customer?: Customers;
  device?: Devices;
  createdBy?: Employees;
  voidedBy?: Employees;
}
