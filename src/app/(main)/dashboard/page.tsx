
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAllTickets } from '@/lib/actions';
import type { Ticket, TicketPriority } from '@/lib/types';
import { TicketListItem } from '@/components/tickets/ticket-list-item';
import { Loader2, Ticket as TicketIcon, ListChecks, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const { user, role } = useAuth();
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTickets() {
      if (user) {
        setIsLoading(true);
        try {
          const tickets = await getAllTickets();
          setAllTickets(tickets);
        } catch (error) {
          console.error("Error fetching tickets:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchTickets();
  }, [user]);

  const priorityOrder: Record<TicketPriority, number> = { High: 0, Medium: 1, Low: 2 };

  const adminOpenTickets = role === 'Admin'
    ? allTickets
        .filter(ticket => ticket.status === "Open")
        .sort((a, b) => {
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); 
        })
    : [];

  const userCreatedTickets = role === 'User'
    ? allTickets
        .filter(ticket => ticket.userId === user?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) 
    : [];
  
  if (isLoading && !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <div className="p-8 text-center">Por favor, inicia sesión para ver el dashboard.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido/a, {user.name}!
        </h1>
        <p className="text-muted-foreground">
          {role === 'Admin'
            ? "Aquí tienes un resumen de los tickets abiertos que requieren tu atención."
            : "Aquí puedes ver el estado de los tickets que has creado."}
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Cargando tickets...</p>
        </div>
      )}

      {!isLoading && role === 'Admin' && (
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-6 w-6 text-destructive" />
              Tickets Abiertos (Prioridad Alta Primero)
            </CardTitle>
            <CardDescription>
              Estos son todos los tickets actualmente abiertos, ordenados por urgencia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adminOpenTickets.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <ListChecks className="mx-auto h-12 w-12 mb-3" />
                <p className="font-semibold">¡Todo al día!</p>
                <p>No hay tickets abiertos actualmente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {adminOpenTickets.map(ticket => (
                  <TicketListItem key={ticket.id} ticket={ticket} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && role === 'User' && (
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TicketIcon className="mr-2 h-6 w-6 text-primary" />
              Mis Tickets Creados
            </CardTitle>
            <CardDescription>
              Aquí puedes ver el estado de todos los tickets que has enviado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userCreatedTickets.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <TicketIcon className="mx-auto h-12 w-12 mb-3" />
                 <p className="font-semibold">No has creado tickets aún.</p>
                 <p>Puedes crear uno desde la sección de "Tickets".</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {userCreatedTickets.map(ticket => (
                  <TicketListItem key={ticket.id} ticket={ticket} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
