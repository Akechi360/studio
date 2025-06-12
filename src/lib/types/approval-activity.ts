export interface CreateApprovalActivityLogEntryData {
  approvalRequestId: string;
  action: string;
  userId: string;
  userName: string;
  userEmail: string;
}

export interface ApprovalActivityLogEntry {
  id: string;
  displayId: string;
  approvalRequestId: string;
  action: string;
  userId: string;
  userName: string;
  userEmail: string;
  comment: string | null;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
} 