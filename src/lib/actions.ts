
"use server";

import { z } from "zod";
import type { Ticket, Comment, TicketPriority, TicketStatus, User } from "./types";
import { mockTickets } from "./mock-data"; 
import { suggestSolution as genAiSuggestSolution } from "@/ai/flows/suggest-solution";
import { revalidatePath } from "next/cache";
import { TICKET_PRIORITIES_ENGLISH, TICKET_STATUSES_ENGLISH } from "./constants";

// --- Ticket Creation ---
const CreateTicketSchema = z.object({
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  priority: z.enum(TICKET_PRIORITIES_ENGLISH as [TicketPriority, ...TicketPriority[]]), // Use English for backend consistency
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

  const newTicket: Ticket = {
    id: (mockTickets.length + 1).toString(), // Simple ID generation for mock
    subject,
    description,
    priority: priority as TicketPriority, // priority is already English
    status: "Open", // Default status in English
    attachments: [], 
    userId,
    userName,
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: [],
  };
  mockTickets.unshift(newTicket); 

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${newTicket.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports"); // Also revalidate admin reports

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

  const ticket = mockTickets.find(t => t.id === ticketId);
  if (!ticket) {
    return { success: false, message: "Ticket no encontrado." };
  }

  const newComment: Comment = {
    id: `comment-${ticketId}-${ticket.comments.length + 1}`,
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
  status: z.enum(TICKET_STATUSES_ENGLISH as [TicketStatus, ...TicketStatus[]]), // Use English for backend consistency
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
  
  const ticket = mockTickets.find(t => t.id === ticketId);
  if (!ticket) {
    return { success: false, message: "Ticket no encontrado." };
  }

  ticket.status = validatedFields.data.status as TicketStatus;
  ticket.updatedAt = new Date();

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports");

  // Translate status for the message
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


// --- AI Solution Suggestion ---
export async function getAISolutionSuggestion(ticketDescription: string) {
  if (!ticketDescription || ticketDescription.trim().length < 10) {
    return { suggestion: null, error: "La descripción del ticket es demasiado corta para una sugerencia significativa." };
  }
  try {
    // Assuming genAiSuggestSolution can handle Spanish input or is language-agnostic
    const result = await genAiSuggestSolution({ ticketDescription });
    // If AI returns Spanish, great. If English, might need translation layer later.
    return { suggestion: result.suggestedSolution, error: null };
  } catch (error) {
    console.error("Error al obtener sugerencia de IA:", error);
    return { suggestion: null, error: "Fallo al obtener sugerencia de IA." };
  }
}


// --- Fetch Ticket by ID (Simulated) ---
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  // await new Promise(resolve => setTimeout(resolve, 50)); // Removed delay
  const ticket = mockTickets.find(t => t.id === ticketId);
  return ticket || null;
}

// --- Fetch All Tickets (Simulated) ---
export async function getAllTickets(): Promise<Ticket[]> {
  // await new Promise(resolve => setTimeout(resolve, 50)); // Removed delay
  return [...mockTickets].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// --- Fetch Dashboard Stats (Simulated) ---
export async function getDashboardStats() {
  // await new Promise(resolve => setTimeout(resolve, 50)); // Removed delay
  const total = mockTickets.length;
  const open = mockTickets.filter(t => t.status === "Open").length;
  const inProgress = mockTickets.filter(t => t.status === "In Progress").length;
  const resolved = mockTickets.filter(t => t.status === "Resolved").length;
  const closed = mockTickets.filter(t => t.status === "Closed").length;

  // Map English keys to Spanish names for charts
  const priorityDisplayMap: Record<TicketPriority, string> = { Low: "Baja", Medium: "Media", High: "Alta" };
  const statusDisplayMap: Record<TicketStatus, string> = { Open: "Abierto", "In Progress": "En Progreso", Resolved: "Resuelto", Closed: "Cerrado"};
  
  const byPriority = (TICKET_PRIORITIES_ENGLISH).map(pKey  => ({
    name: priorityDisplayMap[pKey],
    value: mockTickets.filter(t => t.priority === pKey).length,
  }));

  const byStatus = (TICKET_STATUSES_ENGLISH).map(sKey => ({
    name: statusDisplayMap[sKey],
    value: mockTickets.filter(t => t.status === sKey).length,
  }));

  return {
    summary: { total, open, inProgress, resolved, closed },
    stats: { byPriority, byStatus },
  };
}
