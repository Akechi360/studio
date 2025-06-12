export interface CreateAuditLogEntryData {
  userEmail: string;
  action: string;
}

export interface AuditLogEntry {
  id: string;
  displayId?: string;
  userEmail: string;
  action: string;
  createdAt: Date;
  updatedAt: Date;
} 