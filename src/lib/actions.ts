
"use server";

import { z } from "zod";
import type { Ticket, Comment, TicketPriority, TicketStatus, User, InventoryItem } from "./types"; // Añadido InventoryItem
import { 
  addTicketToMock, 
  getAllTicketsFromMock, 
  getTicketByIdFromMock,
  getRawTicketsStoreForStats,
  getAllInventoryItemsFromMock, // Nueva importación
  addInventoryItemToMock // Nueva importación
} from "./mock-data"; 
import { revalidatePath } from "next/cache";
import { TICKET_PRIORITIES_ENGLISH, TICKET_STATUSES_ENGLISH } from "./constants";

// --- Ticket Creation ---
const CreateTicketSchema = z.object({
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  priority: z.enum(TICKET_PRIORITIES_ENGLISH as [TicketPriority, ...TicketPriority[]]),
});

export async function createTicketAction(
  userId: string, 
  userName: string,
  values: z.infer<typeof CreateTicketSchema>
) {
  const validatedFields = CreateTicketSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al crear ticket debido a errores de validación.",
    };
  }

  const { subject, description, priority } = validatedFields.data;
  
  const currentTickets = getRawTicketsStoreForStats();
  const newTicket: Ticket = {
    id: (currentTickets.length + 1).toString() + Date.now().toString(), // ID más único
    subject,
    description,
    priority: priority as TicketPriority,
    status: "Open",
    attachments: [], 
    userId,
    userName,
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: [],
  };
  
  addTicketToMock(newTicket);

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${newTicket.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports");

  return {
    success: true,
    message: "¡Ticket creado exitosamente!",
    ticketId: newTicket.id,
  };
}

// --- Add Comment ---
const AddCommentSchema = z.object({
  text: z.string().min(1, "El comentario no puede estar vacío."),
});

export async function addCommentAction(
  ticketId: string,
  commenter: User, 
  values: z.infer<typeof AddCommentSchema>
) {
  const validatedFields = AddCommentSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al añadir comentario debido a errores de validación.",
    };
  }

  const ticket = getTicketByIdFromMock(ticketId);
  if (!ticket) {
    return { success: false, message: "Ticket no encontrado." };
  }

  const newComment: Comment = {
    id: `comment-${ticketId}-${ticket.comments.length + 1}-${Date.now()}`,
    text: validatedFields.data.text,
    userId: commenter.id,
    userName: commenter.name,
    userAvatarUrl: commenter.avatarUrl,
    createdAt: new Date(),
  };

  ticket.comments.push(newComment);
  ticket.updatedAt = new Date();
  
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets"); 
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports");
  
  return {
    success: true,
    message: "¡Comentario añadido exitosamente!",
    comment: newComment,
  };
}

// --- Update Ticket Status ---
const UpdateTicketStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES_ENGLISH as [TicketStatus, ...TicketStatus[]]),
});

export async function updateTicketStatusAction(
  ticketId: string,
  values: z.infer<typeof UpdateTicketStatusSchema>
) {
  const validatedFields = UpdateTicketStatusSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al actualizar estado debido a errores de validación.",
    };
  }
  
  const ticket = getTicketByIdFromMock(ticketId);
  if (!ticket) {
    return { success: false, message: "Ticket no encontrado." };
  }

  ticket.status = validatedFields.data.status as TicketStatus;
  ticket.updatedAt = new Date();

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports");

  const statusDisplayMap: Record<TicketStatus, string> = {
    Open: "Abierto",
    "In Progress": "En Progreso",
    Resolved: "Resuelto",
    Closed: "Cerrado",
  };

  return {
    success: true,
    message: `Estado del ticket actualizado a ${statusDisplayMap[ticket.status]}.`,
  };
}

// --- Fetch Ticket by ID ---
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  return getTicketByIdFromMock(ticketId);
}

// --- Fetch All Tickets ---
export async function getAllTickets(): Promise<Ticket[]> {
  return getAllTicketsFromMock();
}

// --- Fetch Dashboard Stats ---
export async function getDashboardStats() {
  const currentTickets = getRawTicketsStoreForStats();
  
  const total = currentTickets.length;
  const open = currentTickets.filter(t => t.status === "Open").length;
  const inProgress = currentTickets.filter(t => t.status === "In Progress").length;
  const resolved = currentTickets.filter(t => t.status === "Resolved").length;
  const closed = currentTickets.filter(t => t.status === "Closed").length;

  const priorityDisplayMap: Record<TicketPriority, string> = { Low: "Baja", Medium: "Media", High: "Alta" };
  const statusDisplayMap: Record<TicketStatus, string> = { Open: "Abierto", "In Progress": "En Progreso", Resolved: "Resuelto", Closed: "Cerrado"};
  
  const byPriority = (TICKET_PRIORITIES_ENGLISH).map(pKey  => ({
    name: priorityDisplayMap[pKey],
    value: currentTickets.filter(t => t.priority === pKey).length,
  }));

  const byStatus = (TICKET_STATUSES_ENGLISH).map(sKey => ({
    name: statusDisplayMap[sKey],
    value: currentTickets.filter(t => t.status === sKey).length,
  }));

  return {
    summary: { total, open, inProgress, resolved, closed },
    stats: { byPriority, byStatus },
  };
}

// --- Inventory Actions ---

// Fetch All Inventory Items
export async function getAllInventoryItems(): Promise<InventoryItem[]> {
  // Simular un pequeño retraso como si fuera una API real
  await new Promise(resolve => setTimeout(resolve, 200)); 
  return getAllInventoryItemsFromMock();
}

// (El esquema para añadir artículos del inventario se definirá cuando creemos el formulario)
// export async function addInventoryItemAction(...) { ... }
