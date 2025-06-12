import { ApprovalStatus } from '@prisma/client';

export interface CreateApprovalRequestData {
  type: string;
  status: string;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;
  approverId: string;
  approverName: string;
  approverEmail?: string;
  ticketId: string;
  ticketSubject: string;
}

export interface ApprovalRequest {
  id: string;
  displayId?: string;
  type: string;
  status: string;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;
  approverId: string;
  approverName: string;
  approverEmail?: string;
  ticketId: string;
  ticketSubject: string;
  createdAt: Date;
  updatedAt: Date;
} 