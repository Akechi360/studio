
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
export const INVENTORY_ITEM_CATEGORIES = [
  "Computadora",
  "Monitor",
  "Teclado",
  "Mouse",
  "Impresora",
  "Escaner",
  "Router",
  "Switch",
  "Servidor",
  "Laptop",
  "Tablet",
  "Proyector",
  "Telefono IP",
  "Otro Periferico",
  "Software",
  "Licencia",
  "Otro"
] as const;

export type InventoryItemCategory = typeof INVENTORY_ITEM_CATEGORIES[number];

export const INVENTORY_ITEM_STATUSES = [
  "En Uso",
  "En Almacen",
  "En Reparacion",
  "De Baja",
  "Perdido"
] as const;

export type InventoryItemStatus = typeof INVENTORY_ITEM_STATUSES[number];

export type StorageType = "HDD" | "SSD";

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryItemCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  ram?: string;
  storageType?: StorageType;
  storage?: string; // For capacity like "500GB", "1TB"
  processor?: string;
  screenSize?: string;
  ipAddress?: string;
  quantity: number;
  location?: string;
  purchaseDate?: string;
  supplier?: string;
  warrantyEndDate?: string;
  status: InventoryItemStatus;
  notes?: string;
  addedByUserId: string;
  addedByUserName: string;
  createdAt: Date;
  updatedAt: Date;
  lastSeen?: Date;
}
