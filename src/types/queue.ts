export type UserRole = 'citizen' | 'staff' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  nationalId?: string; // Citizen ID / Aadhaar / National Identity
  staffId?: string;     // Employee ID e.g. EMP-CMC-409
  officeId?: string;
  assignedCounterId?: string;
  department?: string;
  designation?: string;
  avatarUrl?: string;
}

export interface GovernmentOffice {
  id: string;
  name: string;
  code: string;
  department: string;
  address: string;
  operatingHours: string;
  contactNumber: string;
  activeCountersCount: number;
}

export interface GovernmentService {
  id: string;
  officeId: string;
  name: string;
  code: string; // e.g. "CERT", "REV", "PEN", "DOC", "TAX", "HELP"
  category: string;
  avgDurationMinutes: number;
  requiredDocuments: string[];
  description: string;
  feeAmount: number; // 0 if free public service
}

export type CounterStatus = 'active' | 'break' | 'closed';

export interface ServiceCounter {
  id: string;
  officeId: string;
  counterNumber: number;
  name: string;
  serviceIds: string[];
  staffId?: string;
  staffName?: string;
  status: CounterStatus;
  currentTokenId?: string;
  breakReason?: string;
  breakStartTime?: string;
}

export type TokenStatus = 'WAITING' | 'SERVING' | 'COMPLETED' | 'SKIPPED';
export type TokenPriority = 'STANDARD' | 'SENIOR_CITIZEN' | 'SPECIALLY_ABLED';

export interface DigitalToken {
  id: string;
  tokenNumber: string; // e.g. CERT-101, TAX-102
  officeId: string;
  officeName: string;
  serviceId: string;
  serviceName: string;
  serviceCode: string;
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  citizenNationalId: string;
  counterId?: string;
  counterNumber?: number;
  staffId?: string;
  staffName?: string;
  status: TokenStatus;
  priority: TokenPriority;
  createdAt: string;
  calledAt?: string;
  arrivalConfirmedAt?: string; // Set when staff confirms citizen has arrived at desk
  servedAt?: string;
  completedAt?: string;
  skippedAt?: string;
  skipReason?: string;
  estimatedWaitMinutes: number;
  notes?: string;
  qrPayload?: string;
  ocrProcessed?: boolean;
}

export interface QueueEvent {
  id: string;
  tokenId: string;
  tokenNumber: string;
  officeId: string;
  eventType: 'GENERATED' | 'CALLED' | 'ARRIVAL_CONFIRMED' | 'SERVING_STARTED' | 'COMPLETED' | 'SKIPPED' | 'COUNTER_STATUS_CHANGE';
  counterNumber?: number;
  performedBy: string;
  timestamp: string;
  details: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  tokenId: string;
  tokenNumber: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  createdAt: string;
  read: boolean;
}

export type SoundPreference = 'turn-only' | 'all' | 'muted';

export interface QueueStatistics {
  totalTokensToday: number;
  waitingCount: number;
  servingCount: number;
  completedCount: number;
  skippedCount: number;
  activeCountersCount: number;
  breakCountersCount: number;
  closedCountersCount: number;
  averageWaitTimeMinutes: number;
  averageServiceDurationMinutes: number;
  officeBreakdown: {
    officeId: string;
    officeName: string;
    waiting: number;
    serving: number;
    completed: number;
    activeCounters: number;
  }[];
}
