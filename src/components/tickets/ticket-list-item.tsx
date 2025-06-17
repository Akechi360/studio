"use client";

import type { Ticket, TicketPriority, TicketStatus } from "@/lib/types";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, MessageSquare, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketListItemProps {
  ticket: Ticket;
}

const priorityDisplayMap: Record<TicketPriority, string> = {
  High: "Alta",
  Medium: "Media",
  Low: "Baja",
};

const priorityColors: Record<TicketPriority, string> = {
  High: "bg-red-500 hover:bg-red-600",
  Medium: "bg-yellow-500 hover:bg-yellow-600",
  Low: "bg-green-500 hover:bg-green-600",
};

const statusDisplayMap: Record<TicketStatus, string> = {
  Open: "Abierto",
  "InProgress": "En Progreso",
  Resolved: "Resuelto",
  Closed: "Cerrado",
};

const statusColors: Record<TicketStatus, string> = {
  Open: "bg-blue-500 hover:bg-blue-600",
  "InProgress": "bg-orange-500 hover:bg-orange-600",
  Resolved: "bg-emerald-500 hover:bg-emerald-600",
  Closed: "bg-gray-500 hover:bg-gray-600",
};


export function TicketListItem({ ticket }: TicketListItemProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold leading-tight">
            <Link
              href={`/tickets/${ticket.displayId}`}
              className="hover:underline text-primary"
            >
              <span>{ticket.subject}</span>
            </Link>
          </CardTitle>
          <Badge className={cn("text-xs text-white", priorityColors[ticket.priority])}>
            {priorityDisplayMap[ticket.priority]}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Ticket #{ticket.displayId} por {ticket.userName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground line-clamp-2">
          {ticket.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs", statusColors[ticket.status], "text-white border-none")}>
                    {statusDisplayMap[ticket.status]}
                </Badge>
                 {ticket.attachments.length > 0 && (
                    <span className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" /> {ticket.attachments.length}
                    </span>
                )}
                <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> {ticket.comments.length}
                </span>
            </div>
            <time dateTime={ticket.createdAt.toISOString()} title={format(ticket.createdAt, "PPPppp", { locale: es })}>
              {formatDistanceToNow(ticket.createdAt, { addSuffix: true, locale: es })}
            </time>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Link
          href={`/tickets/${ticket.displayId}`}
          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
        >
          <span className="flex items-center gap-1">
            Ver Detalles <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </CardFooter>
    </Card>
  );
}
