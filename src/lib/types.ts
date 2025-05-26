
export type Role = "User" | "Admin" | "Presidente IEQ";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  department?: string;
  password?: string;
}

export type TicketPriority = "Low" | "Medium" | "High";
export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";

export interface Attachment {
  id: string;
  fileName: string;
  url: string;
  size: number;
  type?: string;
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
  userEmail?: string;
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

export const INVENTORY_ITEM_CATEGORIES = [
  "Computadora", "Monitor", "Teclado", "Mouse", "Impresora", "Escaner",
  "Router", "Switch", "Servidor", "Laptop", "Tablet", "Proyector",
  "Telefono IP", "Otro Periferico", "Software", "Licencia", "Otro"
] as const;
export type InventoryItemCategory = typeof INVENTORY_ITEM_CATEGORIES[number];

export const INVENTORY_ITEM_STATUSES = [
  "En Uso", "En Almacen", "En Reparacion", "De Baja", "Perdido"
] as const;
export type InventoryItemStatus = typeof INVENTORY_ITEM_STATUSES[number];

export const RAM_OPTIONS = ["No Especificado", "2GB", "4GB", "8GB", "12GB", "16GB", "32GB", "64GB", "Otro"] as const;
export type RamOption = typeof RAM_OPTIONS[number];

export const STORAGE_TYPES_ZOD_ENUM = ["HDD", "SSD"] as const;
export type StorageType = typeof STORAGE_TYPES_ZOD_ENUM[number];

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryItemCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  ram?: RamOption;
  storageType?: StorageType;
  storage?: string;
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

export type ExcelInventoryItemData = {
  Nombre?: string;
  Categoría?: string;
  Marca?: string;
  Modelo?: string;
  'Número de Serie'?: string;
  Procesador?: string;
  RAM?: string;
  'Tipo de Almacenamiento'?: string;
  'Capacidad de Almacenamiento'?: string;
  Cantidad?: string | number;
  Ubicación?: string;
  Estado?: string;
  'Notas Adicionales'?: string;
  [key: string]: any;
};

// --- Approval Module Types ---
export type ApprovalRequestType = "Compra" | "PagoProveedor";
export type ApprovalStatus = "Pendiente" | "Aprobado" | "Rechazado" | "InformacionSolicitada";
export type PaymentType = 'Contado' | 'Cuotas';

export interface ApprovalActivityLogEntry {
  id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: Date;
  comment?: string;
}

export interface PaymentInstallment {
  id: string;
  amount: number;
  dueDate: Date;
}

export interface AttachmentClientData {
  fileName: string;
  size: number;
  type?: string;
}


export interface ApprovalRequest {
  id: string;
  type: ApprovalRequestType;
  subject: string;
  description?: string;
  status: ApprovalStatus;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;
  createdAt: Date;
  updatedAt: Date;
  attachments: Attachment[];
  activityLog: ApprovalActivityLogEntry[];

  approverId?: string;
  approverName?: string;
  approverComment?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  infoRequestedAt?: Date;

  approvedPaymentType?: PaymentType;
  approvedAmount?: number;
  paymentInstallments?: PaymentInstallment[];

  // Purchase specific
  itemDescription?: string;
  estimatedPrice?: number;
  supplierCompra?: string;

  // Payment specific
  supplierPago?: string;
  totalAmountToPay?: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details?: string;
}

// --- Gestión de Fallas Types ---
export type FallaStatus =
  | 'Reportada'
  | 'En Revisión'
  | 'En Reparación'
  | 'Pendiente Repuesto'
  | 'Resuelta'
  | 'No Reparable';

export const FALLA_STATUSES: FallaStatus[] = [
  'Reportada', 'En Revisión', 'En Reparación', 'Pendiente Repuesto', 'Resuelta', 'No Reparable'
];

export type FallaPriority = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export const FALLA_PRIORITIES: FallaPriority[] = ['Baja', 'Media', 'Alta', 'Crítica'];


export interface FallaHistoryEntry {
  timestamp: Date;
  status: FallaStatus;
  notes: string;
  userId: string;
  userName: string;
}

export interface Falla {
  id: string;
  subject: string;
  description: string;
  reportedByUserId: string;
  reportedByUserName: string;
  reportedAt: Date;
  location: string; // Ubicación del equipo/falla (ej. "UCI", "Sala de Espera", "Oficina Adm.")
  equipment?: string; // Equipo afectado (ej. "Ventilador Dräger", "Aire Acondicionado") - Opcional
  priority: FallaPriority;
  currentStatus: FallaStatus;
  assignedToUserId: string; // ID del usuario asignado (por defecto, Emilia o nadie al inicio)
  assignedToUserName: string; // Nombre del usuario asignado
  history: FallaHistoryEntry[];
  resolutionDetails?: string;
  partsUsed?: string;
  resolutionDate?: Date;
}
