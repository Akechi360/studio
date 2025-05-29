
// This file's content is being significantly reduced as we move away from mock data.
// Specific mock arrays and their manipulation functions will be removed.
// Functions might be replaced with TODOs for Prisma integration if they were directly called
// by client components (though most data access should go through server actions).

import type { Ticket, InventoryItem, AuditLogEntry as AuditLogEntryType, ApprovalRequest, CasoDeMantenimiento } from '@/lib/types';

// --- Mock Data Stores (To be removed or replaced by database) ---
// declare global {
//   // eslint-disable-next-line no-var
//   var __mock_tickets_store__: Ticket[] | undefined;
//   // eslint-disable-next-line no-var
//   var __mock_inventory_store__: InventoryItem[] | undefined;
//   // eslint-disable-next-line no-var
//   var __mock_audit_logs_store__: AuditLogEntryType[] | undefined;
//   // eslint-disable-next-line no-var
//   var __mock_approvals_store__: ApprovalRequest[] | undefined;
//   // eslint-disable-next-line no-var
//   var __mock_casos_mantenimiento_store__: CasoDeMantenimiento[] | undefined;
// }

// let ticketsStore_internal: Ticket[] = global.__mock_tickets_store__ || [];
// let inventoryStore_internal: InventoryItem[] = global.__mock_inventory_store__ || [];
// let auditLogsStore_internal: AuditLogEntryType[] = global.__mock_audit_logs_store__ || [];
// let approvalsStore_internal: ApprovalRequest[] = global.__mock_approvals_store__ || [];
// let casosMantenimientoStore_internal: CasoDeMantenimiento[] = global.__mock_casos_mantenimiento_store__ || [];

// if (process.env.NODE_ENV !== 'production') {
//   global.__mock_tickets_store__ = ticketsStore_internal;
//   global.__mock_inventory_store__ = inventoryStore_internal;
//   global.__mock_audit_logs_store__ = auditLogsStore_internal;
//   global.__mock_approvals_store__ = approvalsStore_internal;
//   global.__mock_casos_mantenimiento_store__ = casosMantenimientoStore_internal;
// }


// --- Ticket Functions (To be refactored to use Prisma) ---
export function getAllTicketsFromMock(): Ticket[] {
  // TODO: Replace with Prisma client call
  console.warn("Mock function getAllTicketsFromMock called. Needs Prisma implementation.");
  return [];
}

export function getTicketByIdFromMock(id: string): Ticket | null {
  // TODO: Replace with Prisma client call
  console.warn("Mock function getTicketByIdFromMock called. Needs Prisma implementation.");
  return null;
}

export function addTicketToMock(ticket: Ticket): void {
  // TODO: Replace with Prisma client call
  console.warn("Mock function addTicketToMock called. Needs Prisma implementation.");
}

export function getRawTicketsStoreForStats(): Ticket[] {
   // TODO: Replace with Prisma client call for aggregated stats
  console.warn("Mock function getRawTicketsStoreForStats called. Needs Prisma implementation for stats.");
  return [];
}

// --- Inventory Functions (To be refactored to use Prisma) ---
export function getAllInventoryItemsFromMock(): InventoryItem[] {
  // TODO: Replace with Prisma client call
  console.warn("Mock function getAllInventoryItemsFromMock called. Needs Prisma implementation.");
  return [];
}

export function getInventoryItemByIdFromMock(id: string): InventoryItem | null {
  // TODO: Replace with Prisma client call
  console.warn("Mock function getInventoryItemByIdFromMock called. Needs Prisma implementation.");
  return null;
}

export function addInventoryItemToMock(item: InventoryItem): void {
  // TODO: Replace with Prisma client call
  console.warn("Mock function addInventoryItemToMock called. Needs Prisma implementation.");
}

export function updateInventoryItemInMock(updatedItem: InventoryItem): boolean {
  // TODO: Replace with Prisma client call
  console.warn("Mock function updateInventoryItemInMock called. Needs Prisma implementation.");
  return false;
}

export function deleteInventoryItemFromMock(itemId: string): boolean {
  // TODO: Replace with Prisma client call
  console.warn("Mock function deleteInventoryItemFromMock called. Needs Prisma implementation.");
  return false;
}

export function getRawInventoryStore(): InventoryItem[] {
  // TODO: Replace with Prisma client call if direct access is needed, otherwise remove.
  console.warn("Mock function getRawInventoryStore called. Needs Prisma implementation or removal.");
  return [];
}

// --- Audit Log Functions (To be refactored to use Prisma) ---
export function getAllAuditLogsFromMock(): AuditLogEntryType[] {
  // TODO: Replace with Prisma client call
  console.warn("Mock function getAllAuditLogsFromMock called. Needs Prisma implementation.");
  return [];
}

export function addAuditLogEntryToMock(entryData: Omit<AuditLogEntryType, 'id' | 'timestamp'>): AuditLogEntryType {
  // TODO: Replace with Prisma client call
  console.warn("Mock function addAuditLogEntryToMock called. Needs Prisma implementation.");
  // Return a placeholder or throw error, as this function structure changes with DB.
  const placeholderEntry: AuditLogEntryType = {
    id: `log-placeholder-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...entryData,
  };
  return placeholderEntry;
}

// --- Approval Request Functions (To be refactored to use Prisma) ---
export function getAllApprovalRequestsFromMock(): ApprovalRequest[] {
  // TODO: Replace with Prisma client call
  console.warn("Mock function getAllApprovalRequestsFromMock called. Needs Prisma implementation.");
  return [];
}

export function getApprovalRequestByIdFromMock(id: string): ApprovalRequest | null {
  // TODO: Replace with Prisma client call
  console.warn("Mock function getApprovalRequestByIdFromMock called. Needs Prisma implementation.");
  return null;
}

export function addApprovalRequestToMock(request: ApprovalRequest): void {
  // TODO: Replace with Prisma client call
  console.warn("Mock function addApprovalRequestToMock called. Needs Prisma implementation.");
}

export function updateApprovalRequestInMock(updatedRequest: ApprovalRequest): boolean {
  // TODO: Replace with Prisma client call
  console.warn("Mock function updateApprovalRequestInMock called. Needs Prisma implementation.");
  return false;
}

export function getRawApprovalsStore(): ApprovalRequest[] {
   // TODO: Replace with Prisma client call if direct access is needed, otherwise remove.
  console.warn("Mock function getRawApprovalsStore called. Needs Prisma implementation or removal.");
  return [];
}

// --- CasoDeMantenimiento Functions (To be refactored to use Prisma) ---
export function getAllCasosMantenimientoFromMock(): CasoDeMantenimiento[] {
  // TODO: Replace with Prisma client call
  console.warn("Mock function getAllCasosMantenimientoFromMock called. Needs Prisma implementation.");
  return [];
}

export function getCasoMantenimientoByIdFromMock(id: string): CasoDeMantenimiento | null {
  // TODO: Replace with Prisma client call
  console.warn("Mock function getCasoMantenimientoByIdFromMock called. Needs Prisma implementation.");
  return null;
}

export function addCasoMantenimientoToMock(caso: CasoDeMantenimiento): void {
  // TODO: Replace with Prisma client call
  console.warn("Mock function addCasoMantenimientoToMock called. Needs Prisma implementation.");
}

export function updateCasoMantenimientoInMock(updatedCaso: CasoDeMantenimiento): boolean {
  // TODO: Replace with Prisma client call
  console.warn("Mock function updateCasoMantenimientoInMock called. Needs Prisma implementation.");
  return false;
}

export function getRawCasosMantenimientoStore(): CasoDeMantenimiento[] {
  // TODO: Replace with Prisma client call if direct access is needed, otherwise remove.
  console.warn("Mock function getRawCasosMantenimientoStore called. Needs Prisma implementation or removal.");
  return [];
}

// For compatibility with old code expecting these arrays directly, though they will be empty.
export const mockTickets: Ticket[] = [];
export const mockInventory: InventoryItem[] = [];
export const mockAuditLogs: AuditLogEntryType[] = [];
export const mockApprovalRequests: ApprovalRequest[] = [];
export const mockCasosMantenimiento: CasoDeMantenimiento[] = [];
