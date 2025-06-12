import { PrismaClient, TicketStatus, Ticket } from '@prisma/client';
import { CreateTicketData } from '../types/tickets';
import { generateSequentialId } from '../id-generator';

const prisma = new PrismaClient();

export async function createTicket(data: CreateTicketData): Promise<Ticket> {
  const { subject, description, priority, category, userId, userName, userEmail } = data;
  const displayId = await generateSequentialId('Ticket');
  const ticket = await prisma.ticket.create({
    data: {
      subject,
      description,
      priority,
      category,
      status: TicketStatus.Open,
      userId,
      userName,
      userEmail,
      displayId,
    },
  });
  return ticket;
} 