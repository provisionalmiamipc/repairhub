//import { BaseEntity } from '../base-entity.model';
import { Centers } from './Centers';
import { Customers } from './Customers';
import { Devices } from './Devices';
import { Employees } from './Employees';
import { ServiceTypes } from './ServiceTypes';
import { Stores } from './Stores';


export interface Appointments {
  id: number;
  appointmentCode: string;
  centerId: number;
  storeId: number;
  customer: string;
  date: string;
  time: string;
  deviceId: number;
  serviceTypeId: number;
  duration: number;
  notes: string;
  cloused: boolean;
  canceled: boolean;
  assignedTechId: number | null;
  createdById: number;
  createdAt?: Date;
  center?: Centers;  
  device?: Devices;
  employee?: Employees;
  serviceType?: ServiceTypes;
  store?: Stores;
}
