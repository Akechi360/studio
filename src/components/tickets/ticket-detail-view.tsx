
"use client";

import type { Ticket, TicketStatus, TicketPriority as TicketPriorityType } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CommentCard } from "./comment-card";
import { AddCommentForm } from "./add-comment-form";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { Paperclip, UserCircle, CalendarDays, Tag, Info, MessageSquare, ExternalLink, Loader2 } from "lucide-react"; 
import { TICKET_STATUSES, TICKET_PRIORITIES_ENGLISH, TICKET_PRIORITIES as TICKET_PRIORITIES_SPANISH } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTicketStatusAction, getTicketById } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TicketDetailViewProps {
  ticket: Ticket;
}

const priorityDisplayMap: Record<TicketPriorityType, string> = {
  High: "Alta",
  Medium: "Media",
  Low: "Baja",
};

const priorityColors: Record<TicketPriorityType, string> = {
  High: "bg-red-100 text-red-700 border-red-300",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Low: "bg-green-100 text-green-700 border-green-300",
};

const statusDisplayMap: Record<TicketStatus, string> = {
  Open: "Abierto",
  "In Progress": "En Progreso",
  Resolved: "Resuelto",
  Closed: "Cerrado",
};

const statusColors: Record<TicketStatus, string> = {
  Open: "bg-blue-100 text-blue-700 border-blue-300",
  "In Progress": "bg-orange-100 text-orange-700 border-orange-300",
  Resolved: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Closed: "bg-gray-100 text-gray-700 border-gray-300",
};


export function TicketDetailView({ ticket: initialTicket }: TicketDetailViewProps) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const handleStatusChange = async (newStatusValue: string) => {
    const statusEntry = Object.entries(statusDisplayMap).find(([_, spanish]) => spanish === newStatusValue);
    const newStatus = statusEntry ? statusEntry[0] as TicketStatus : null;

    if (!newStatus) {
        toast({ title: "Error", description: "Estado inválido seleccionado.", variant: "destructive" });
        return;
    }
    
    if (role !== 'Admin' || !user?.email) {
      toast({ title: "Permiso Denegado", description: "Solo los administradores pueden cambiar el estado del ticket y se requiere un correo electrónico.", variant: "destructive" });
      return;
    }
    setIsStatusUpdating(true);
    const result = await updateTicketStatusAction(ticket.id, { status: newStatus, actingUserEmail: user.email });
    if (result.success) {
      setTicket(prev => ({ ...prev!, status: newStatus, updatedAt: new Date() }));
      toast({ title: "Estado Actualizado", description: result.message });
    } else {
      toast({ title: "Actualización Fallida", description: result.message, variant: "destructive" });
    }
    setIsStatusUpdating(false);
  };

  const onCommentAdded = async () => {
    const updatedTicketData = await getTicketById(ticket.id);
    if (updatedTicketData) {
      setTicket(updatedTicketData);
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del ticket después de añadir el comentario.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="w-full shadow-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold leading-tight">{ticket.subject}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Ticket #{ticket.id} &bull; Última actualización: {format(new Date(ticket.updatedAt), "PPp", { locale: es })}
              </CardDescription>
            </div>
            {role === 'Admin' ? (
              <div className="flex items-center gap-2 w-full md:w-auto">
                {isStatusUpdating && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                <Select 
                  onValueChange={(value) => handleStatusChange(value as string)} 
                  defaultValue={statusDisplayMap[ticket.status]} 
                  disabled={isStatusUpdating}
                >
                  <SelectTrigger className="w-full md:w-[180px] mt-2 md:mt-0">
                    <SelectValue placeholder="Cambiar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((status) => ( 
                      <SelectItem key={status} value={status}> 
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Badge className={cn("text-sm px-3 py-1", statusColors[ticket.status])}>{statusDisplayMap[ticket.status]}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <UserCircle className="h-5 w-5 text-primary" />
              <div>
                <span className="font-medium">Reportado por:</span> {ticket.userName} ({ticket.userEmail || 'N/A'})
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <span className="font-medium">Creado:</span> {format(new Date(ticket.createdAt), "PPp", { locale: es })}
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <Badge className={cn("text-xs px-2 py-0.5", priorityColors[ticket.priority])}>Prioridad {priorityDisplayMap[ticket.priority]}</Badge>
            </div>
          </div>
          
          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><Info className="h-5 w-5 mr-2 text-primary"/>Descripción</h3>
            <p className="text-foreground/90 whitespace-pre-wrap p-4 bg-muted/30 rounded-md leading-relaxed">{ticket.description}</p>
          </div>

          {ticket.attachments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center"><Paperclip className="h-5 w-5 mr-2 text-primary"/>Archivos Adjuntos</h3>
              <ul className="space-y-2">
                {ticket.attachments.map((att) => (
                  <li key={att.id} className="flex items-center">
                    <a href={att.url} target="_blank" rel="noopener noreferrer" 
                       className="text-primary hover:underline flex items-center gap-1 p-2 rounded-md hover:bg-primary/10 transition-colors"
                       data-ai-hint="descarga archivo">
                      <ExternalLink className="h-4 w-4" />
                      {att.fileName} ({(att.size / 1024).toFixed(1)} KB)
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><MessageSquare className="h-6 w-6 mr-2 text-primary"/>Comentarios ({ticket.comments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {ticket.comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aún no hay comentarios.</p>
          ) : (
            <div className="space-y-2">
              {ticket.comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="w-full">
            <h4 className="text-lg font-semibold mb-3">Añade Tu Comentario</h4>
            <AddCommentForm ticketId={ticket.id} onCommentAdded={onCommentAdded} />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
