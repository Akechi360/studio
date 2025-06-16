"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAllTickets, getApprovalRequestsForUser } from '@/lib/actions';
import type { Ticket, TicketPriority, ApprovalRequest } from '@/lib/types';
import { TicketListItem } from '@/components/tickets/ticket-list-item';
import { ApprovalRequestListItem } from '@/components/approvals/approval-request-list-item';
import { ApprovalDetailsModal } from '@/components/approvals/ApprovalDetailsModal';
import { Ticket as TicketIcon, ListChecks, AlertCircle, FileCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false); // Changed from true to false initially
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

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

      if (role === 'Presidente') {
        setIsLoadingApprovals(true); // Set to true when starting fetch
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

  const handleViewRequestDetails = (requestId: string) => {
    setSelectedRequestId(requestId);
  };

  const handleCloseRequestDetails = () => {
    setSelectedRequestId(null);
  };

  const handleRequestActionSuccess = () => {
    // Recargar las aprobaciones pendientes después de una acción exitosa
    if (user && role === 'Presidente') {
      setIsLoadingApprovals(true);
      getApprovalRequestsForUser(user.id, user.role)
        .then(approvals => {
          setPendingApprovals(approvals);
        })
        .catch(error => {
          console.error("Error recargando aprobaciones:", error);
          toast({ 
            title: "Error", 
            description: "No se pudieron recargar las aprobaciones pendientes.", 
            variant: "destructive" 
          });
        })
        .finally(() => {
          setIsLoadingApprovals(false);
        });
    }
    setSelectedRequestId(null);
  };

  if (isLoadingTickets && !user) { 
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading message="Cargando tickets..." variant="circles" size="md" />
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
          {role === 'Presidente' && "Revisa y gestiona las aprobaciones pendientes."}
        </p>
      </div>

      {role === 'Presidente' && (
        <Card className="shadow-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileCheck className="mr-2 h-6 w-6 text-primary" />
              Aprobaciones Pendientes
            </CardTitle>
            <CardDescription>
              Estas son las solicitudes actuales que requieren tu acción.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingApprovals ? (
              <div className="flex items-center justify-center py-10">
                <Loading message="Cargando aprobaciones pendientes..." variant="circles" size="md" />
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <FileCheck className="mx-auto h-12 w-12 mb-3" />
                <p className="font-semibold">¡Todo al día!</p>
                <p>No tienes aprobaciones pendientes en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {pendingApprovals.map(req => (
                  <ApprovalRequestListItem 
                    key={req.id} 
                    request={req} 
                    onViewDetails={handleViewRequestDetails}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de detalles de la solicitud */}
      <ApprovalDetailsModal
        isOpen={selectedRequestId !== null}
        onClose={handleCloseRequestDetails}
        requestId={selectedRequestId}
        onActionSuccess={handleRequestActionSuccess}
      />

      {(isLoadingTickets && (role === 'Admin' || role === 'User')) && (
        <Loading message="Cargando tickets..." variant="circles" size="md" />
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
