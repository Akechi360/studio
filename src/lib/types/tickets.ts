import { TicketStatus, TicketPriority, TicketCategory } from '@prisma/client';

export interface Ticket {
  id: string;
  displayId: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  userId: string;
  userName: string;
  userEmail?: string;
  createdAt: Date;
  updatedAt: Date;
  comments: Comment[];
  attachments: Attachment[];
}

export interface CreateTicketData {
  subject: string;
  description: string;
  priority: string;
  category: string;
  userId: string;
  userName: string;
  userEmail?: string;
} 