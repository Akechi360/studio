import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TicketListItem } from '@/components/tickets/ticket-list-item';
import { getAllTickets } from '@/lib/actions';
import { PlusCircle, Filter } from 'lucide-react';
import { TicketFilters } from '@/components/tickets/ticket-filters'; // Import the new client component
import type { Ticket } from '@/lib/types';


export default async function TicketsPage() {
  const tickets: Ticket[] = await getAllTickets(); 

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets de Soporte</h1>
          <p className="text-muted-foreground">
            Ver, gestionar y responder a los tickets de soporte.
          </p>
        </div>
        <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <Link href="/tickets/new">
            <span className="flex items-center">
              <PlusCircle className="mr-2 h-5 w-5" />
              Crear Nuevo Ticket
            </span>
          </Link>
        </Button>
      </div>
      <TicketFilters />
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">No Se Encontraron Tickets</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            No hay tickets que coincidan con tus filtros actuales, o aún no se han creado tickets.
          </p>
          <Button asChild>
            <Link href="/tickets/new">
              <span className="flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                Crea Tu Primer Ticket
              </span>
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
