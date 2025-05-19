
"use client";

import type { Ticket, TicketStatus } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AISuggestion } from "./ai-suggestion";
import { CommentCard } from "./comment-card";
import { AddCommentForm } from "./add-comment-form";
import { format } from "date-fns";
import { Paperclip, UserCircle, CalendarDays, Tag, Info, ListChecks, MessageSquare, ExternalLink, Edit } from "lucide-react";
import { TICKET_STATUSES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTicketStatusAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TicketDetailViewProps {
  ticket: Ticket;
}

const priorityColors: Record<Ticket["priority"], string> = {
  High: "bg-red-100 text-red-700 border-red-300",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Low: "bg-green-100 text-green-700 border-green-300",
};

const statusColors: Record<Ticket["status"], string> = {
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

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (role !== 'Admin') {
      toast({ title: "Permission Denied", description: "Only admins can change ticket status.", variant: "destructive" });
      return;
    }
    setIsStatusUpdating(true);
    const result = await updateTicketStatusAction(ticket.id, { status: newStatus });
    if (result.success) {
      setTicket(prev => ({ ...prev!, status: newStatus, updatedAt: new Date() }));
      toast({ title: "Status Updated", description: result.message });
    } else {
      toast({ title: "Update Failed", description: result.message, variant: "destructive" });
    }
    setIsStatusUpdating(false);
  };

  const onCommentAdded = async () => {
    // Re-fetch or update ticket comments, for now just faking an update to updatedAt
    // In a real app, you might re-fetch the ticket or update the comments array directly
    // For simplicity, if addCommentAction already revalidates, this might not be strictly needed
    // but to reflect updatedAt change immediately:
    setTicket(prev => ({...prev!, updatedAt: new Date()})); 
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold leading-tight">{ticket.subject}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Ticket #{ticket.id} &bull; Last updated: {format(new Date(ticket.updatedAt), "PPp")}
              </CardDescription>
            </div>
            {role === 'Admin' ? (
              <Select onValueChange={(value) => handleStatusChange(value as TicketStatus)} defaultValue={ticket.status} disabled={isStatusUpdating}>
                <SelectTrigger className="w-full md:w-[180px] mt-2 md:mt-0">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge className={cn("text-sm px-3 py-1", statusColors[ticket.status])}>{ticket.status}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <UserCircle className="h-5 w-5 text-primary" />
              <div>
                <span className="font-medium">Reported by:</span> {ticket.userName}
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <span className="font-medium">Created:</span> {format(new Date(ticket.createdAt), "PPp")}
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <Badge className={cn("text-xs px-2 py-0.5", priorityColors[ticket.priority])}>{ticket.priority} Priority</Badge>
            </div>
          </div>
          
          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><Info className="h-5 w-5 mr-2 text-primary"/>Description</h3>
            <p className="text-foreground/90 whitespace-pre-wrap p-4 bg-muted/30 rounded-md leading-relaxed">{ticket.description}</p>
          </div>

          {ticket.attachments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center"><Paperclip className="h-5 w-5 mr-2 text-primary"/>Attachments</h3>
              <ul className="space-y-2">
                {ticket.attachments.map((att) => (
                  <li key={att.id} className="flex items-center">
                    <a href={att.url} target="_blank" rel="noopener noreferrer" 
                       className="text-primary hover:underline flex items-center gap-1 p-2 rounded-md hover:bg-primary/10 transition-colors"
                       data-ai-hint="file download">
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

      {role === "Admin" && (
        <AISuggestion ticketDescription={ticket.description} />
      )}

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><MessageSquare className="h-6 w-6 mr-2 text-primary"/>Comments ({ticket.comments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {ticket.comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No comments yet.</p>
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
            <h4 className="text-lg font-semibold mb-3">Add Your Comment</h4>
            <AddCommentForm ticketId={ticket.id} onCommentAdded={onCommentAdded} />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
