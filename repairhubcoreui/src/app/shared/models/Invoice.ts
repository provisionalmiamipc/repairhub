import { Centers } from './Centers';
import { Customers } from './Customers';
import { Employees } from './Employees';
import { Items } from './Items';
import { ServiceOrders } from './ServiceOrders';
import { Stores } from './Stores';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'void';
export type InvoiceItemType = 'service' | 'part' | 'labor' | 'custom';

export interface InvoiceItem {
  id?: number;
  invoiceId?: number;
  itemType: InvoiceItemType;
  itemId?: number | null;
  serviceOrderId?: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  lineTotal?: number;
  sortOrder?: number;
  item?: Items;
  serviceOrder?: ServiceOrders;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  centerId: number;
  storeId: number;
  customerId: number;
  serviceOrderId?: number | null;
  createdById?: number | null;
  status: InvoiceStatus;
  issueDate: string | Date;
  dueDate?: string | Date | null;
  via?: string | null;
  billToName?: string | null;
  billToAddress?: string | null;
  billToContact?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string | null;
  serviceSummary?: string | null;
  terms?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  center?: Centers;
  store?: Stores;
  customer?: Customers;
  serviceOrder?: ServiceOrders;
  createdBy?: Employees;
  items?: InvoiceItem[];
}
