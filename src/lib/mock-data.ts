
import type { Ticket, Comment, TicketPriority, TicketStatus } from '@/lib/types';

// Augment the NodeJS global type to include our custom store
declare global {
  // eslint-disable-next-line no-var
  var __mock_tickets_store__: Ticket[] | undefined;
}

let ticketsStore_internal: Ticket[];

if (process.env.NODE_ENV === 'production') {
  ticketsStore_internal = [];
} else {
  if (!global.__mock_tickets_store__) {
    global.__mock_tickets_store__ = [];
  }
  ticketsStore_internal = global.__mock_tickets_store__;
}

export function getAllTicketsFromMock(): Ticket[] {
  // Return a new sorted array to prevent external mutations of the sort order
  // and ensure freshness from the store
  return [...ticketsStore_internal].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getTicketByIdFromMock(id: string): Ticket | null {
  return ticketsStore_internal.find(ticket => ticket.id === id) || null;
}

export function addTicketToMock(ticket: Ticket): void {
  // Ensure no duplicate IDs (though current ID gen should be fine for mock)
  const existingIndex = ticketsStore_internal.findIndex(t => t.id === ticket.id);
  if (existingIndex !== -1) {
    // If somehow an ID collision happens, replace the existing one
    ticketsStore_internal[existingIndex] = ticket;
  } else {
    ticketsStore_internal.unshift(ticket); // Add to the beginning for chronological reverse order display
  }
}

// Used by getDashboardStats to ensure it gets the current state of the store
export function getRawTicketsStoreForStats(): Ticket[] {
  return ticketsStore_internal;
}

// For legacy compatibility if any part of the code still uses mockTickets directly
// (should be refactored away)
export const mockTickets: Ticket[] = ticketsStore_internal;
