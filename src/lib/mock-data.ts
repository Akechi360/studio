
import type { Ticket, InventoryItem } from '@/lib/types';

// --- Almacén de Tickets ---
declare global {
  // eslint-disable-next-line no-var
  var __mock_tickets_store__: Ticket[] | undefined;
  // eslint-disable-next-line no-var
  var __mock_inventory_store__: InventoryItem[] | undefined;
}

let ticketsStore_internal: Ticket[];
let inventoryStore_internal: InventoryItem[];

if (process.env.NODE_ENV === 'production') {
  ticketsStore_internal = [];
  inventoryStore_internal = [];
} else {
  if (!global.__mock_tickets_store__) {
    global.__mock_tickets_store__ = [];
  }
  ticketsStore_internal = global.__mock_tickets_store__;

  if (!global.__mock_inventory_store__) {
    global.__mock_inventory_store__ = [];
  }
  inventoryStore_internal = global.__mock_inventory_store__;
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

// Para compatibilidad con código antiguo (debería refactorizarse)
export const mockTickets: Ticket[] = ticketsStore_internal;
export const mockInventory: InventoryItem[] = inventoryStore_internal;

