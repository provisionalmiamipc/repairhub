export interface PublicServiceOrderTimelineItemDto {
  status: string;
  date: string;
}

export interface PublicServiceOrderDiagnosticDto {
  title: string;
  date: string;
}

export interface PublicServiceOrderReceivedPartDto {
  accessory: string;
  observations?: string | null;
}

export interface PublicServiceOrderWarrantyDto {
  available: boolean;
  duration?: string;
  endDate?: string | null;
}

export interface PublicServiceOrderStatusDto {
  orderCode: string;
  createdAt: string;
  updatedAt: string;
  currentStatus: string;
  isClosed: boolean;
  isCanceled: boolean;
  device: {
    type: string;
    brand: string;
    model: string;
    serialMasked: string;
  };
  reportedIssue: string;
  timeline: PublicServiceOrderTimelineItemDto[];
  diagnostics: PublicServiceOrderDiagnosticDto[];
  receivedParts: PublicServiceOrderReceivedPartDto[];
  warranty: PublicServiceOrderWarrantyDto;
}
