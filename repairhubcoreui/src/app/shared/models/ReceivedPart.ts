export interface ReceivedPart {
  id: number;
  centerId: number;
  storeId: number;
  serviceOrderId: number;
  accessory: string;
  observations?: string;
  createdById?: number | null;
  createdAt?: string;
}
