import { ApprovalRequestType, ApprovalStatus, PaymentStatus } from '@prisma/client';

export interface CreatePaymentInstallmentData {
  amount: number;
  dueDate: Date;
  approvalRequestId: string;
}

export interface PaymentInstallment {
  id: string;
  displayId: string;
  amount: number;
  dueDate: Date;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  isOverdue: boolean;
  daysOverdue: number;
  approvalRequestId: string;
  approvalRequest?: any; // Relación con ApprovalRequest
}

export interface ApprovalRequest {
  id: string;
  displayId: string;
  type: ApprovalRequestType;
  subject: string;
  description?: string;
  status: ApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
  nextDueDate?: Date;
  hasOverduePayments: boolean;
  // ... resto de campos existentes
} 