
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TicketListItem } from '@/components/tickets/ticket-list-item';
import { getAllTickets } from '@/lib/actions';
import { PlusCircle, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TICKET_PRIORITIES, TICKET_STATUSES } from '@/lib/constants';

// This component could be client-side if we add client-side filtering/search
async function TicketFilters() {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 items-end">
      <div className="md:col-span-2 lg:col-span-2">
        <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">Search Tickets</label>
        <div className="relative">
          <Input id="search" placeholder="Search by subject or ID..." className="pl-10" />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
       <div>
        <label htmlFor="status-filter" className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
        <Select>
          <SelectTrigger id="status-filter">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {TICKET_STATUSES.map(status => (
              <SelectItem key={status} value={status.toLowerCase().replace(' ', '-')}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label htmlFor="priority-filter" className="block text-sm font-medium text-muted-foreground mb-1">Priority</label>
        <Select>
          <SelectTrigger id="priority-filter">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {TICKET_PRIORITIES.map(priority => (
              <SelectItem key={priority} value={priority.toLowerCase()}>{priority}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}


export default async function TicketsPage() {
  const tickets = await getAllTickets(); // Server action to fetch tickets

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">
            View, manage, and respond to support tickets.
          </p>
        </div>
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/tickets/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Ticket
          </Link>
        </Button>
      </div>

      <TicketFilters />

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">No Tickets Found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            There are no tickets matching your current filters, or no tickets have been created yet.
          </p>
          <Button asChild>
            <Link href="/tickets/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Ticket
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <TicketListItem key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
