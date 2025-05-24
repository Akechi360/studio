
import type { Ticket, InventoryItem, AuditLogEntry as AuditLogEntryType, ApprovalRequest, ApprovalActivityLogEntry } from '@/lib/types';

declare global {
  // eslint-disable-next-line no-var
  var __mock_tickets_store__: Ticket[] | undefined;
  // eslint-disable-next-line no-var
  var __mock_inventory_store__: InventoryItem[] | undefined;
  // eslint-disable-next-line no-var
  var __mock_audit_logs_store__: AuditLogEntryType[] | undefined;
  // eslint-disable-next-line no-var
  var __mock_approvals_store__: ApprovalRequest[] | undefined;
}

let ticketsStore_internal: Ticket[];
let inventoryStore_internal: InventoryItem[];
let auditLogsStore_internal: AuditLogEntryType[];
let approvalsStore_internal: ApprovalRequest[];

if (process.env.NODE_ENV === 'production') {
  ticketsStore_internal = [];
  inventoryStore_internal = [];
  auditLogsStore_internal = [];
  approvalsStore_internal = [];
} else {
  if (!global.__mock_tickets_store__) {
    global.__mock_tickets_store__ = [];
  }
  ticketsStore_internal = global.__mock_tickets_store__;

  if (!global.__mock_inventory_store__) {
    global.__mock_inventory_store__ = [];
  }
  inventoryStore_internal = global.__mock_inventory_store__;

  if (!global.__mock_audit_logs_store__) {
    global.__mock_audit_logs_store__ = [];
  }
  auditLogsStore_internal = global.__mock_audit_logs_store__;

  if(!global.__mock_approvals_store__){
    global.__mock_approvals_store__ = [];
  }
  approvalsStore_internal = global.__mock_approvals_store__;
}

// --- Funciones para Tickets ---
export function getAllTicketsFromMock(): Ticket[] {
  return [...ticketsStore_internal].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getTicketByIdFromMock(id: string): Ticket | null {
  return ticketsStore_internal.find(ticket => ticket.id === id) || null;
}

export function addTicketToMock(ticket: Ticket): void {
  const existingIndex = ticketsStore_internal.findIndex(t => t.id === ticket.id);
  if (existingIndex !== -1) {
    ticketsStore_internal[existingIndex] = ticket;
  } else {
    ticketsStore_internal.unshift(ticket);
  }
}

export function getRawTicketsStoreForStats(): Ticket[] {
  return ticketsStore_internal;
}

// --- Funciones para Inventario ---
export function getAllInventoryItemsFromMock(): InventoryItem[] {
  return [...inventoryStore_internal].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getInventoryItemByIdFromMock(id: string): InventoryItem | null {
  return inventoryStore_internal.find(item => item.id === id) || null;
}

export function addInventoryItemToMock(item: InventoryItem): void {
  const existingIndex = inventoryStore_internal.findIndex(i => i.id === item.id);
  if (existingIndex !== -1) {
    inventoryStore_internal[existingIndex] = item;
  } else {
    inventoryStore_internal.unshift(item);
  }
}

export function updateInventoryItemInMock(updatedItem: InventoryItem): boolean {
  const itemIndex = inventoryStore_internal.findIndex(item => item.id === updatedItem.id);
  if (itemIndex !== -1) {
    inventoryStore_internal[itemIndex] = { ...inventoryStore_internal[itemIndex], ...updatedItem, updatedAt: new Date() };
    return true;
  }
  return false;
}

export function deleteInventoryItemFromMock(itemId: string): boolean {
  const initialLength = inventoryStore_internal.length;
  inventoryStore_internal = inventoryStore_internal.filter(item => item.id !== itemId);
  return inventoryStore_internal.length < initialLength;
}

export function getRawInventoryStore(): InventoryItem[] {
  return inventoryStore_internal;
}

// --- Funciones para Logs de Auditoría ---
export function getAllAuditLogsFromMock(): AuditLogEntryType[] {
  return [...auditLogsStore_internal].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function addAuditLogEntryToMock(entryData: Omit<AuditLogEntryType, 'id' | 'timestamp'>): AuditLogEntryType {
  const newLogEntry: AuditLogEntryType = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entryData,
  };
  auditLogsStore_internal.unshift(newLogEntry);
  return newLogEntry;
}

// --- Funciones para Solicitudes de Aprobación ---
export function getAllApprovalRequestsFromMock(): ApprovalRequest[] {
  return [...approvalsStore_internal].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getApprovalRequestByIdFromMock(id: string): ApprovalRequest | null {
  return approvalsStore_internal.find(req => req.id === id) || null;
}

export function addApprovalRequestToMock(request: ApprovalRequest): void {
  const existingIndex = approvalsStore_internal.findIndex(r => r.id === request.id);
  if (existingIndex !== -1) {
    approvalsStore_internal[existingIndex] = request; 
  } else {
    approvalsStore_internal.unshift(request); 
  }
}

export function updateApprovalRequestInMock(updatedRequest: ApprovalRequest): boolean {
  const reqIndex = approvalsStore_internal.findIndex(req => req.id === updatedRequest.id);
  if (reqIndex !== -1) {
    const originalRequest = approvalsStore_internal[reqIndex];
    
    const newActivityLogEntry: ApprovalActivityLogEntry = {
        id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        action: `Estado Cambiado a: ${updatedRequest.status}`,
        userId: updatedRequest.approverId || originalRequest.requesterId, // Use approver if available
        userName: updatedRequest.approverName || originalRequest.requesterName,
        timestamp: new Date(),
        comment: updatedRequest.approverComment,
    };

    // Update main fields
    approvalsStore_internal[reqIndex] = { 
        ...originalRequest, 
        ...updatedRequest, 
        updatedAt: new Date(),
        activityLog: [...originalRequest.activityLog, newActivityLogEntry] // Add to existing log
    };
    return true;
  }
  return false;
}

export function getRawApprovalsStore(): ApprovalRequest[] {
    return approvalsStore_internal;
}


// Para compatibilidad con código antiguo (debería refactorizarse)
export const mockTickets: Ticket[] = ticketsStore_internal;
export const mockInventory: InventoryItem[] = inventoryStore_internal;
export const mockAuditLogs: AuditLogEntryType[] = auditLogsStore_internal;
export const mockApprovalRequests: ApprovalRequest[] = approvalsStore_internal;
