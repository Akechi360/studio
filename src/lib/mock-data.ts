
import type { Ticket, InventoryItem, User } from '@/lib/types'; // Added User for potential future use here

// --- Audit Log Entry (consistent with audit/page.tsx) ---
export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  user: string; // email of the user performing the action
  action: string;
  details?: string;
}

// --- Almacén de Tickets ---
declare global {
  // eslint-disable-next-line no-var
  var __mock_tickets_store__: Ticket[] | undefined;
  // eslint-disable-next-line no-var
  var __mock_inventory_store__: InventoryItem[] | undefined;
  // eslint-disable-next-line no-var
  var __mock_audit_logs_store__: AuditLogEntry[] | undefined;
}

let ticketsStore_internal: Ticket[];
let inventoryStore_internal: InventoryItem[];
let auditLogsStore_internal: AuditLogEntry[];

if (process.env.NODE_ENV === 'production') {
  ticketsStore_internal = [];
  inventoryStore_internal = [];
  auditLogsStore_internal = [];
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
export function getAllAuditLogsFromMock(): AuditLogEntry[] {
  // Return a copy, sorted with newest first
  return [...auditLogsStore_internal].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function addAuditLogEntryToMock(entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const newLogEntry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entryData,
  };
  auditLogsStore_internal.unshift(newLogEntry); // Add to the beginning for newest first
  return newLogEntry;
}


// Para compatibilidad con código antiguo (debería refactorizarse)
export const mockTickets: Ticket[] = ticketsStore_internal;
export const mockInventory: InventoryItem[] = inventoryStore_internal;
export const mockAuditLogs: AuditLogEntry[] = auditLogsStore_internal;
