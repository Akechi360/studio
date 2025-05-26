
import type { Ticket, InventoryItem, AuditLogEntry as AuditLogEntryType, ApprovalRequest, Falla } from '@/lib/types';

declare global {
  // eslint-disable-next-line no-var
  var __mock_tickets_store__: Ticket[] | undefined;
  // eslint-disable-next-line no-var
  var __mock_inventory_store__: InventoryItem[] | undefined;
  // eslint-disable-next-line no-var
  var __mock_audit_logs_store__: AuditLogEntryType[] | undefined;
  // eslint-disable-next-line no-var
  var __mock_approvals_store__: ApprovalRequest[] | undefined;
  // eslint-disable-next-line no-var
  var __mock_fallas_store__: Falla[] | undefined;
}

let ticketsStore_internal: Ticket[];
let inventoryStore_internal: InventoryItem[];
let auditLogsStore_internal: AuditLogEntryType[];
let approvalsStore_internal: ApprovalRequest[];
let fallasStore_internal: Falla[];


if (process.env.NODE_ENV === 'production') {
  ticketsStore_internal = [];
  inventoryStore_internal = [];
  auditLogsStore_internal = [];
  approvalsStore_internal = [];
  fallasStore_internal = [];
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

  if (!global.__mock_fallas_store__) {
    global.__mock_fallas_store__ = [];
  }
  fallasStore_internal = global.__mock_fallas_store__;
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

    let actionDescription = `Estado Cambiado a: ${updatedRequest.status}`;
     if (originalRequest.status !== updatedRequest.status) {
        if (updatedRequest.status === "Aprobado") {
            actionDescription = `Solicitud Aprobada (${updatedRequest.approvedPaymentType || 'N/A'})`;
        } else if (updatedRequest.status === "Rechazado") {
            actionDescription = "Solicitud Rechazada";
        } else if (updatedRequest.status === "InformacionSolicitada") {
            actionDescription = "Información Adicional Solicitada";
        }
    }


    const newActivityLogEntry: AuditLogEntryType = {
        id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        action: actionDescription,
        user: updatedRequest.approverName || originalRequest.requesterName || "Sistema", // Use approverName here
        timestamp: new Date().toISOString(),
        details: `Comentario: ${updatedRequest.approverComment || 'N/A'}`, // Example details
    };
    
    // Assuming activityLog should be an array of strings or a more structured log object.
    // For now, let's ensure it's an array of ApprovalActivityLogEntry
    const currentActivityLog = Array.isArray(originalRequest.activityLog) ? originalRequest.activityLog : [];


    const finalRequestData: ApprovalRequest = {
      ...originalRequest,
      ...updatedRequest,
      updatedAt: new Date(),
      activityLog: [
          ...currentActivityLog,
          { // Adapt newActivityLogEntry to ApprovalActivityLogEntry structure
            id: newActivityLogEntry.id,
            action: newActivityLogEntry.action,
            userId: updatedRequest.approverId || originalRequest.requesterId,
            userName: newActivityLogEntry.user, // This now correctly refers to approverName or requesterName
            timestamp: new Date(newActivityLogEntry.timestamp),
            comment: updatedRequest.approverComment,
          }
      ],
      approvedAt: updatedRequest.status === "Aprobado" ? new Date() : originalRequest.approvedAt,
      rejectedAt: updatedRequest.status === "Rechazado" ? new Date() : originalRequest.rejectedAt,
      infoRequestedAt: updatedRequest.status === "InformacionSolicitada" ? new Date() : originalRequest.infoRequestedAt,
    };
    
    if (finalRequestData.type === "PagoProveedor") {
        if (finalRequestData.status === "Aprobado") {
            if (finalRequestData.approvedPaymentType === 'Contado') {
                finalRequestData.paymentInstallments = []; 
            }
        }
    } else if (finalRequestData.type === "Compra" && finalRequestData.status === "Aprobado") {
        finalRequestData.approvedPaymentType = undefined;
        finalRequestData.paymentInstallments = [];
    }


    approvalsStore_internal[reqIndex] = finalRequestData;
    return true;
  }
  return false;
}

export function getRawApprovalsStore(): ApprovalRequest[] {
    return approvalsStore_internal;
}

// --- Funciones para Gestión de Fallas ---
export function getAllFallasFromMock(): Falla[] {
  return [...fallasStore_internal].sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
}

export function getFallaByIdFromMock(id: string): Falla | null {
  return fallasStore_internal.find(falla => falla.id === id) || null;
}

export function addFallaToMock(falla: Falla): void {
  const existingIndex = fallasStore_internal.findIndex(f => f.id === falla.id);
  if (existingIndex !== -1) {
    fallasStore_internal[existingIndex] = falla;
  } else {
    fallasStore_internal.unshift(falla);
  }
}

export function updateFallaInMock(updatedFalla: Falla): boolean {
  const fallaIndex = fallasStore_internal.findIndex(f => f.id === updatedFalla.id);
  if (fallaIndex !== -1) {
    fallasStore_internal[fallaIndex] = { ...fallasStore_internal[fallaIndex], ...updatedFalla };
    return true;
  }
  return false;
}

export function getRawFallasStore(): Falla[] {
  return fallasStore_internal;
}


// Para compatibilidad con código antiguo (debería refactorizarse)
export const mockTickets: Ticket[] = ticketsStore_internal;
export const mockInventory: InventoryItem[] = inventoryStore_internal;
export const mockAuditLogs: AuditLogEntryType[] = auditLogsStore_internal;
export const mockApprovalRequests: ApprovalRequest[] = approvalsStore_internal;
export const mockFallas: Falla[] = fallasStore_internal;
