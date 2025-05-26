
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

// --- Gestión de Casos de Mantenimiento Types ---
export const CASO_STATUSES = [
  'Registrado', 'Pendiente Presupuesto', 'Presupuesto Aprobado', 'En Servicio/Reparación', 'Pendiente Respaldo', 'Resuelto', 'Cancelado'
] as const;
export type CasoMantenimientoStatus = typeof CASO_STATUSES[number];

export const CASO_PRIORITIES = ['Baja', 'Media', 'Alta', 'Crítica'] as const;
export type CasoMantenimientoPriority = typeof CASO_PRIORITIES[number];

export interface CasoMantenimientoLogEntry {
  timestamp: Date;
  action: string;
  notes: string;
  userId: string;
  userName: string;
  statusAfterAction?: CasoMantenimientoStatus;
}

export interface CasoDeMantenimiento {
  id: string;
  title: string;
  description: string;
  location: string;
  equipment?: string;
  priority: CasoMantenimientoPriority;
  currentStatus: CasoMantenimientoStatus;
  registeredAt: Date;
  registeredByUserId: string;
  registeredByUserName: string;
  assignedProviderName: string;
  providerContactPerson?: string;
  expectedResolutionDate?: Date;
  lastFollowUpDate?: Date;
  nextFollowUpDate?: Date;
  log: CasoMantenimientoLogEntry[];
  resolutionDetails?: string;
  cost?: number;
  invoicingDetails?: string;
  resolvedAt?: Date;
}
