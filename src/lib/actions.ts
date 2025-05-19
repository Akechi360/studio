
"use server";

import { z } from "zod";
import type { Ticket, Comment, TicketPriority, TicketStatus, User } from "./types";
import { mockTickets } from "./mock-data"; // Assuming mock data is used for now
import { suggestSolution as genAiSuggestSolution } from "@/ai/flows/suggest-solution";
import { revalidatePath } from "next/cache";

// --- Ticket Creation ---
const CreateTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  priority: z.enum(["Low", "Medium", "High"]),
  // attachments: z.array(z.object({ fileName: z.string(), url: z.string(), size: z.number() })).optional(), // Simplified
});

export async function createTicketAction(
  userId: string, // In a real app, this would come from the authenticated session
  userName: string,
  values: z.infer<typeof CreateTicketSchema>
) {
  const validatedFields = CreateTicketSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to create ticket due to validation errors.",
    };
  }

  const { subject, description, priority } = validatedFields.data;

  // Simulate database operation
  const newTicket: Ticket = {
    id: (mockTickets.length + 1).toString(),
    subject,
    description,
    priority: priority as TicketPriority,
    status: "Open",
    attachments: [], // Simplified
    userId,
    userName,
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: [],
  };
  mockTickets.unshift(newTicket); // Add to the beginning of the array

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${newTicket.id}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Ticket created successfully!",
    ticketId: newTicket.id,
  };
}

// --- Add Comment ---
const AddCommentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty."),
});

export async function addCommentAction(
  ticketId: string,
  commenter: User, // User object of the person commenting
  values: z.infer<typeof AddCommentSchema>
) {
  const validatedFields = AddCommentSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to add comment due to validation errors.",
    };
  }

  const ticket = mockTickets.find(t => t.id === ticketId);
  if (!ticket) {
    return { message: "Ticket not found." };
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
  revalidatePath("/tickets"); // For potential last updated sorting on list view
  
  return {
    success: true,
    message: "Comment added successfully!",
    comment: newComment,
  };
}

// --- Update Ticket Status ---
const UpdateTicketStatusSchema = z.object({
  status: z.enum(["Open", "In Progress", "Resolved", "Closed"]),
});

export async function updateTicketStatusAction(
  ticketId: string,
  values: z.infer<typeof UpdateTicketStatusSchema>
) {
  const validatedFields = UpdateTicketStatusSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Failed to update status due to validation errors.",
    };
  }
  
  const ticket = mockTickets.find(t => t.id === ticketId);
  if (!ticket) {
    return { message: "Ticket not found." };
  }

  ticket.status = validatedFields.data.status as TicketStatus;
  ticket.updatedAt = new Date();

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Ticket status updated to ${ticket.status}.`,
  };
}


// --- AI Solution Suggestion ---
export async function getAISolutionSuggestion(ticketDescription: string) {
  if (!ticketDescription || ticketDescription.trim().length < 10) {
    return { suggestion: null, error: "Ticket description is too short for a meaningful suggestion." };
  }
  try {
    const result = await genAiSuggestSolution({ ticketDescription });
    return { suggestion: result.suggestedSolution, error: null };
  } catch (error) {
    console.error("Error fetching AI solution:", error);
    return { suggestion: null, error: "Failed to fetch AI suggestion." };
  }
}


// --- Fetch Ticket by ID (Simulated) ---
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  const ticket = mockTickets.find(t => t.id === ticketId);
  return ticket || null;
}

// --- Fetch All Tickets (Simulated) ---
export async function getAllTickets(): Promise<Ticket[]> {
   // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockTickets].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// --- Fetch Dashboard Stats (Simulated) ---
export async function getDashboardStats() {
  await new Promise(resolve => setTimeout(resolve, 200));
  const total = mockTickets.length;
  const open = mockTickets.filter(t => t.status === "Open").length;
  const inProgress = mockTickets.filter(t => t.status === "In Progress").length;
  const resolved = mockTickets.filter(t => t.status === "Resolved").length;
  const closed = mockTickets.filter(t => t.status === "Closed").length;

  const byPriority = (["Low", "Medium", "High"] as TicketPriority[]).map(p => ({
    name: p,
    value: mockTickets.filter(t => t.priority === p).length,
  }));
  const byStatus = (["Open", "In Progress", "Resolved", "Closed"] as TicketStatus[]).map(s => ({
    name: s,
    value: mockTickets.filter(t => t.status === s).length,
  }));

  return {
    summary: { total, open, inProgress, resolved, closed },
    stats: { byPriority, byStatus },
  };
}

