
export type Role = "User" | "Admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export type TicketPriority = "Low" | "Medium" | "High";
export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";

export interface Attachment {
  id: string;
  fileName: string;
  url: string; // For simplicity, could be a data URL or placeholder
  size: number; // in bytes
}

export interface Comment {
  id: string;
  text: string;
  userId: string; // ID of the user who made the comment
  userName: string; // Name of the user for display
  userAvatarUrl?: string;
  createdAt: Date;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  attachments: Attachment[];
  userId: string; // ID of the user who created the ticket
  userName: string; // Name of the user for display
  createdAt: Date;
  updatedAt: Date;
  comments: Comment[];
}

export interface TicketSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface TicketStats {
  byPriority: { name: TicketPriority; value: number }[];
  byStatus: { name: TicketStatus; value: number }[];
}
