
export type Role = "User" | "Admin" | "Presidente IEQ";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  department?: string;
  password?: string; // Should be hashed in DB
}

export type TicketPriority = "Low" | "Medium" | "High";
export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";

export interface Attachment {
  id: string;
  fileName: string;
  url: string;
  size: number;
  type?: string;
  ticketId?: string | null; // Relation to Ticket
  approvalRequestId?: string | null; // Relation to ApprovalRequest
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  createdAt: Date;
  ticketId: string; // Relation to Ticket
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

export const STORAGE_TYPES_ZOD_ENUM = ["HDD", "SSD", "No Especificado"] as const; // Updated
export type StorageType = (typeof STORAGE_TYPES_ZOD_ENUM)[number];


export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryItemCategory;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  ram?: RamOption | null;
  storageType?: StorageType | null;
  storage?: string | null;
  processor?: string | null;
  screenSize?: string | null;
  ipAddress?: string | null;
  quantity: number;
  location?: string | null;
  purchaseDate?: string | null; // Consider using Date type if more manipulation is needed
  supplier?: string | null;
  warrantyEndDate?: string | null; // Consider using Date type
  status: InventoryItemStatus;
  notes?: string | null;
  addedByUserId: string;
  addedByUserName: string;
  createdAt: Date;
  updatedAt: Date;
  lastSeen?: Date | null;
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
  comment?: string | null;
  approvalRequestId: string; // Relation to ApprovalRequest
}

export interface PaymentInstallment {
  id: string;
  amount: number;
  dueDate: Date;
  approvalRequestId: string; // Relation to ApprovalRequest
  // status?: 'Pendiente' | 'Pagado' | 'Atrasado'; // Future
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
  description?: string | null;
  status: ApprovalStatus;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string | null;
  createdAt: Date;
  updatedAt: Date;
  attachments: Attachment[];
  activityLog: ApprovalActivityLogEntry[];

  approverId?: string | null;
  approverName?: string | null;
  approverEmail?: string | null; // Added from schema
  approverComment?: string | null;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  infoRequestedAt?: Date | null;

  approvedPaymentType?: PaymentType | null;
  approvedAmount?: number | null;
  paymentInstallments?: PaymentInstallment[];

  // Purchase specific
  itemDescription?: string | null;
  estimatedPrice?: number | null;
  supplierCompra?: string | null;

  // Payment specific
  supplierPago?: string | null;
  totalAmountToPay?: number | null;
  // paymentDueDate is no longer a direct field, handled in description
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date; // Changed from string to Date for consistency
  userEmail: string; // Changed from user to userEmail for clarity
  action: string;
  details?: string | null;
}

// --- Gestión de Casos de Mantenimiento Types ---
export const CASO_STATUSES = [
  'Registrado', 'Pendiente Presupuesto', 'Presupuesto Aprobado', 'En Servicio/Reparación', 'Pendiente Respaldo', 'Resuelto', 'Cancelado'
] as const;
export type CasoMantenimientoStatus = typeof CASO_STATUSES[number];

export const CASO_PRIORITIES = ['Baja', 'Media', 'Alta', 'Crítica'] as const;
export type CasoMantenimientoPriority = typeof CASO_PRIORITIES[number];

export interface CasoMantenimientoLogEntry {
  id: string; // Added from schema
  timestamp: Date;
  action: string;
  notes: string;
  userId: string;
  userName: string;
  statusAfterAction?: CasoMantenimientoStatus | null;
  casoDeMantenimientoId: string; // Relation to CasoDeMantenimiento
}

export interface CasoDeMantenimiento {
  id: string;
  title: string;
  description: string;
  location: string;
  equipment?: string | null;
  priority: CasoMantenimientoPriority;
  currentStatus: CasoMantenimientoStatus;
  registeredAt: Date;
  registeredByUserId: string;
  registeredByUserName: string;
  assignedProviderName: string;
  providerContactPerson?: string | null;
  expectedResolutionDate?: Date | null;
  lastFollowUpDate?: Date | null;
  nextFollowUpDate?: Date | null;
  log: CasoMantenimientoLogEntry[];
  resolutionDetails?: string | null;
  cost?: number | null;
  invoicingDetails?: string | null;
  resolvedAt?: Date | null;
}
