
export type Role = "User" | "Admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  department?: string;
}

export type TicketPriority = "Low" | "Medium" | "High";
export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";

export interface Attachment {
  id: string;
  fileName: string;
  url: string; 
  size: number; 
}

export interface Comment {
  id: string;
  text: string;
  userId: string; 
  userName: string; 
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
  userId: string; 
  userName: string; 
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
  byPriority: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
}

// --- Tipos de Inventario ---
export type InventoryItemCategory = 
  | "Computadora" 
  | "Monitor" 
  | "Teclado" 
  | "Mouse" 
  | "Impresora"
  | "Escaner"
  | "Router"
  | "Switch"
  | "Servidor"
  | "Laptop"
  | "Tablet"
  | "Proyector"
  | "Telefono IP"
  | "Otro Periferico"
  | "Software"
  | "Licencia"
  | "Otro";

export interface InventoryItem {
  id: string;
  name: string; // Nombre descriptivo, ej: "PC Enfermería Piso 1" o "Monitor Dell Recepción"
  category: InventoryItemCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  // Campos específicos según categoría (se pueden expandir luego)
  ram?: string; // Para Computadora, Laptop, Servidor
  storage?: string; // Para Computadora, Laptop, Servidor (ej: "512GB SSD", "1TB HDD")
  processor?: string; // Para Computadora, Laptop, Servidor
  screenSize?: string; // Para Monitor, Laptop, Tablet
  ipAddress?: string; // Para dispositivos de red
  // Campos generales
  quantity: number;
  location?: string; // ej: "Recepción", "Consultorio 3", "Almacén Sistemas"
  purchaseDate?: string; // Se puede usar un componente de fecha luego
  supplier?: string;
  warrantyEndDate?: string; // Se puede usar un componente de fecha luego
  status: "En Uso" | "En Almacen" | "En Reparacion" | "De Baja" | "Perdido";
  notes?: string;
  // Auditoría
  addedByUserId: string; // ID del usuario que añadió el item
  addedByUserName: string; // Nombre del usuario que añadió el item
  createdAt: Date;
  updatedAt: Date;
  lastSeen?: Date; // Para auditoría de inventario físico
}
