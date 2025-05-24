
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAllTickets, getApprovalRequestsForUser } from '@/lib/actions';
import type { Ticket, TicketPriority, ApprovalRequest } from '@/lib/types';
import { TicketListItem } from '@/components/tickets/ticket-list-item';
import { Loader2, Ticket as TicketIcon, ListChecks, AlertCircle, FileCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      if (role === 'Admin' || role === 'User') {
        setIsLoadingTickets(true);
        try {
          const tickets = await getAllTickets();
          setAllTickets(tickets);
        } catch (error) {
          console.error("Error fetching tickets:", error);
          toast({ title: "Error", description: "No se pudieron cargar los tickets.", variant: "destructive" });
        } finally {
          setIsLoadingTickets(false);
        }
      }

      if (role === 'Presidente IEQ') {
        setIsLoadingApprovals(true);
        try {
          const approvals = await getApprovalRequestsForUser(user.id, user.role);
          setPendingApprovals(approvals);
        } catch (error) {
          console.error("Error fetching approvals:", error);
          toast({ title: "Error", description: "No se pudieron cargar las aprobaciones pendientes.", variant: "destructive" });
        } finally {
          setIsLoadingApprovals(false);
        }
      }
    }
    fetchDashboardData();
  }, [user, role, toast]);

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

  if (isLoadingTickets && !user) { // Initial loading before user is set
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
    <div className="space-y-8 w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido/a, {user.name}!
        </h1>
        <p className="text-muted-foreground">
          {role === 'Admin' && "Aquí tienes un resumen de los tickets abiertos que requieren tu atención."}
          {role === 'User' && "Aquí puedes ver el estado de los tickets que has creado."}
          {role === 'Presidente IEQ' && "Aquí puedes gestionar las aprobaciones pendientes."}
        </p>
      </div>

      {role === 'Presidente IEQ' && (
        <Card className="shadow-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileCheck className="mr-2 h-6 w-6 text-primary" />
              Aprobaciones Pendientes
            </CardTitle>
            <CardDescription>
              Revisa y gestiona las solicitudes que requieren tu aprobación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingApprovals ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
                <span>Cargando aprobaciones pendientes...</span>
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <FileCheck className="mx-auto h-12 w-12 mb-3" />
                <p className="font-semibold">¡Todo al día!</p>
                <p>No tienes aprobaciones pendientes en este momento.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {pendingApprovals.map(req => (
                    <li key={req.id} className="p-4 border rounded-md shadow-sm hover:shadow-md transition-shadow bg-muted/20">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-primary">{req.subject}</h3>
                            <Badge variant={req.type === "Compra" ? "default" : "secondary"}>{req.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Solicitante: {req.requesterName}</p>
                        <p className="text-sm text-muted-foreground">Fecha Solicitud: {new Date(req.createdAt).toLocaleDateString('es-ES')}</p>
                        {req.type === "Compra" && req.estimatedPrice && (
                            <p className="text-sm text-muted-foreground">Monto Est.: {req.estimatedPrice.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</p>
                        )}
                        {req.type === "PagoProveedor" && req.totalAmountToPay && (
                            <p className="text-sm text-muted-foreground">Monto a Pagar: {req.totalAmountToPay.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</p>
                        )}
                        <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-primary" onClick={() => toast({title: "Funcionalidad en Desarrollo", description: `Ver detalles para ${req.id} aún no está implementado.`})}>
                            Ver Detalles
                        </Button>
                    </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {(isLoadingTickets && (role === 'Admin' || role === 'User')) && (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Cargando tickets...</p>
        </div>
      )}

      {!isLoadingTickets && role === 'Admin' && (
        <Card className="shadow-lg w-full">
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

      {!isLoadingTickets && role === 'User' && (
        <Card className="shadow-lg w-full">
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
