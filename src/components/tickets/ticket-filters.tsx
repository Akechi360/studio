
"use client";

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TICKET_PRIORITIES, TICKET_STATUSES } from '@/lib/constants';
import { Search } from 'lucide-react';

export function TicketFilters() {
  // In a real app, you'd add useState and handlers here for filtering logic
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 items-end">
      <div className="md:col-span-2 lg:col-span-2">
        <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">Buscar Tickets</label>
        <div className="relative">
          <Input id="search" placeholder="Buscar por asunto o ID..." className="pl-10" />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
       <div>
        <label htmlFor="status-filter" className="block text-sm font-medium text-muted-foreground mb-1">Estado</label>
        <Select>
          <SelectTrigger id="status-filter">
            <SelectValue placeholder="Todos los Estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Estados</SelectItem>
            {TICKET_STATUSES.map(status => (
              <SelectItem key={status} value={status.toLowerCase().replace(' ', '-')}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label htmlFor="priority-filter" className="block text-sm font-medium text-muted-foreground mb-1">Prioridad</label>
        <Select>
          <SelectTrigger id="priority-filter">
            <SelectValue placeholder="Todas las Prioridades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las Prioridades</SelectItem>
            {TICKET_PRIORITIES.map(priority => (
              <SelectItem key={priority} value={priority.toLowerCase()}>{priority}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
