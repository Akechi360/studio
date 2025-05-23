
"use server";

import { z } from "zod";
import type { Ticket, Comment, TicketPriority, TicketStatus, User, InventoryItem, InventoryItemCategory, InventoryItemStatus, StorageType, ExcelInventoryItemData, ApprovalRequest, ApprovalRequestType, ApprovalStatus } from "./types";
import type { AuditLogEntry as AuditLogEntryType } from "./mock-data";
import {
  addTicketToMock,
  getAllTicketsFromMock,
  getTicketByIdFromMock,
  getRawTicketsStoreForStats,
  getAllInventoryItemsFromMock,
  addInventoryItemToMock,
  getRawInventoryStore,
  updateInventoryItemInMock,
  deleteInventoryItemFromMock,
  getInventoryItemByIdFromMock,
  addAuditLogEntryToMock,
  getAllAuditLogsFromMock,
  addApprovalRequestToMock, // Added for approvals
  getAllApprovalRequestsFromMock, // Added for approvals
  getApprovalRequestByIdFromMock, // Added for approvals
  updateApprovalRequestInMock // Added for approvals
} from "./mock-data";
import { revalidatePath } from "next/cache";
import { TICKET_PRIORITIES_ENGLISH, TICKET_STATUSES_ENGLISH } from "./constants";
import { INVENTORY_ITEM_CATEGORIES, INVENTORY_ITEM_STATUSES, RAM_OPTIONS, STORAGE_TYPES_ZOD_ENUM } from "./types";
import * as XLSX from 'xlsx';


// --- Audit Log Actions ---
export async function logAuditEvent(performingUserEmail: string, actionDescription: string, details?: string): Promise<void> {
  try {
    addAuditLogEntryToMock({
      user: performingUserEmail,
      action: actionDescription,
      details: details || undefined,
    });
    revalidatePath("/admin/audit");
  } catch (error) {
    console.error("Error logging audit event:", error);
  }
}

export async function getAuditLogs(): Promise<AuditLogEntryType[]> {
  return getAllAuditLogsFromMock();
}

// --- Ticket Creation ---
const CreateTicketSchema = z.object({
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  priority: z.enum(TICKET_PRIORITIES_ENGLISH as [TicketPriority, ...TicketPriority[]]),
  userEmail: z.string().email("Debe ser un correo electrónico válido para el usuario que crea el ticket.")
});

export async function createTicketAction(
  userId: string,
  userName: string,
  values: z.infer<typeof CreateTicketSchema>
) {
  const validatedFields = CreateTicketSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al crear ticket debido a errores de validación.",
    };
  }

  const { subject, description, priority, userEmail } = validatedFields.data;

  const currentTickets = getRawTicketsStoreForStats();
  const newTicket: Ticket = {
    id: (currentTickets.length + 1).toString() + Date.now().toString(),
    subject,
    description,
    priority: priority as TicketPriority,
    status: "Open",
    attachments: [],
    userId,
    userName,
    userEmail,
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: [],
  };

  addTicketToMock(newTicket);
  await logAuditEvent(userEmail, "Creación de Ticket", `Ticket ID: ${newTicket.id}, Asunto: ${subject}`);
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${newTicket.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/analytics");

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
      success: false,
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

  if (commenter.email) {
    await logAuditEvent(commenter.email, "Adición de Comentario", `Ticket ID: ${ticketId}, Usuario: ${commenter.name}`);
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/analytics");

  return {
    success: true,
    message: "¡Comentario añadido exitosamente!",
    comment: newComment,
  };
}

// --- Update Ticket Status ---
const UpdateTicketStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES_ENGLISH as [TicketStatus, ...TicketStatus[]]),
  actingUserEmail: z.string().email("Debe proporcionar el correo del usuario que realiza la acción.")
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

  const { status, actingUserEmail } = validatedFields.data;
  const oldStatus = ticket.status;
  ticket.status = status as TicketStatus;
  ticket.updatedAt = new Date();

  await logAuditEvent(actingUserEmail, "Actualización de Estado de Ticket", `Ticket ID: ${ticketId}, De: ${oldStatus}, A: ${ticket.status}`);
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/analytics");

  const statusDisplayMap: Record<TicketStatus, string> = {
    Open: "Abierto", "In Progress": "En Progreso", Resolved: "Resuelto", Closed: "Cerrado",
  };
  return { success: true, message: `Estado del ticket actualizado a ${statusDisplayMap[ticket.status]}.` };
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

  const byPriority = (TICKET_PRIORITIES_ENGLISH).map(pKey  => ({ name: priorityDisplayMap[pKey], value: currentTickets.filter(t => t.priority === pKey).length }));
  const byStatus = (TICKET_STATUSES_ENGLISH).map(sKey => ({ name: statusDisplayMap[sKey], value: currentTickets.filter(t => t.status === sKey).length }));
  return { summary: { total, open, inProgress, resolved, closed }, stats: { byPriority, byStatus } };
}

// --- Inventory Actions ---
export async function getAllInventoryItems(): Promise<InventoryItem[]> {
  return getAllInventoryItemsFromMock();
}

const BaseInventoryItemSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(100),
  category: z.enum(INVENTORY_ITEM_CATEGORIES),
  brand: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  serialNumber: z.string().max(100).optional(),
  processor: z.string().max(100).optional(),
  ram: z.enum(RAM_OPTIONS).optional(),
  storageType: z.enum(STORAGE_TYPES_ZOD_ENUM).optional(),
  storage: z.string().max(50).optional(),
  quantity: z.coerce.number().int().min(1, "La cantidad debe ser al menos 1."),
  location: z.string().max(100).optional(),
  status: z.enum(INVENTORY_ITEM_STATUSES),
  notes: z.string().max(500).optional(),
});

const categoryPrefixMap: Record<InventoryItemCategory, string> = {
  Computadora: "PC", Monitor: "MON", Teclado: "TEC", Mouse: "MOU", Impresora: "IMP", Escaner: "ESC",
  Router: "ROU", Switch: "SWI", Servidor: "SRV", Laptop: "LAP", Tablet: "TAB", Proyector: "PRO",
  "Telefono IP": "TIP", "Otro Periferico": "PER", Software: "SOF", Licencia: "LIC", Otro: "OTR",
};

export async function addInventoryItemAction(
  currentUser: Pick<User, 'id' | 'name' | 'email'>,
  values: Omit<z.infer<typeof BaseInventoryItemSchema>, "currentUserEmail">
) {
  const validatedFields = BaseInventoryItemSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Fallo al añadir artículo debido a errores de validación." };
  }
  const data = validatedFields.data;
  const prefix = categoryPrefixMap[data.category as InventoryItemCategory];
  const allItems = getRawInventoryStore();
  let maxNum = 0;
  allItems.forEach(item => {
    if (item.id.startsWith(`${prefix}-IEQ-`)) {
      try {
        const numPart = parseInt(item.id.substring(item.id.lastIndexOf('-') + 1), 10);
        if (numPart > maxNum) maxNum = numPart;
      } catch (e) { /* ignore */ }
    }
  });
  const newNum = maxNum + 1;
  const formattedNum = String(newNum).padStart(3, '0');
  const newId = `${prefix}-IEQ-${formattedNum}`;
  const newItem: InventoryItem = {
    id: newId, ...data, category: data.category as InventoryItemCategory, status: data.status as InventoryItemStatus,
    addedByUserId: currentUser.id, addedByUserName: currentUser.name, createdAt: new Date(), updatedAt: new Date(),
  };
  addInventoryItemToMock(newItem);
  await logAuditEvent(currentUser.email, "Adición de Artículo de Inventario", `Artículo ID: ${newItem.id}, Nombre: ${newItem.name}`);
  revalidatePath("/inventory");
  return { success: true, message: `Artículo "${newItem.name}" con ID "${newId}" añadido exitosamente.`, item: newItem };
}

export async function updateInventoryItemAction(
  itemId: string,
  actingUserEmail: string,
  values: Omit<z.infer<typeof BaseInventoryItemSchema>, "actingUserEmail">
) {
  const validatedFields = BaseInventoryItemSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Fallo al actualizar artículo debido a errores de validación." };
  }
  const itemToUpdate = getInventoryItemByIdFromMock(itemId);
  if (!itemToUpdate) return { success: false, message: "Artículo no encontrado." };
  const updatedData = validatedFields.data;
  const updatedItem: InventoryItem = {
    ...itemToUpdate, ...updatedData, category: updatedData.category as InventoryItemCategory, status: updatedData.status as InventoryItemStatus, updatedAt: new Date(),
  };
  const success = updateInventoryItemInMock(updatedItem);
  if (success) {
    await logAuditEvent(actingUserEmail, "Actualización de Artículo de Inventario", `Artículo ID: ${itemId}, Nombre: ${updatedItem.name}`);
    revalidatePath("/inventory");
    return { success: true, message: `Artículo "${updatedItem.name}" actualizado exitosamente.` };
  }
  return { success: false, message: "No se pudo actualizar el artículo." };
}

export async function deleteInventoryItemAction(itemId: string, actingUserEmail: string) {
  const itemToDelete = getInventoryItemByIdFromMock(itemId);
  if (!itemToDelete) return { success: false, message: "Artículo no encontrado para eliminar." };
  const success = deleteInventoryItemFromMock(itemId);
  if (success) {
    await logAuditEvent(actingUserEmail, "Eliminación de Artículo de Inventario", `Artículo ID: ${itemId}, Nombre: ${itemToDelete.name}`);
    revalidatePath("/inventory");
    return { success: true, message: "Artículo eliminado exitosamente." };
  }
  return { success: false, message: "No se pudo eliminar el artículo o no fue encontrado." };
}

const excelToInternalFieldMap: Record<string, keyof InventoryItem | keyof Omit<z.infer<typeof BaseInventoryItemSchema>, 'name'>> = {
  'nombre': 'name', 'nombre del articulo': 'name', 'nombre del artículo': 'name', 'articulo': 'name', 'artículo': 'name', 'equipo': 'name',
  'categoría': 'category', 'categoria': 'category', 'marca': 'brand', 'modelo': 'model',
  'número de serie': 'serialNumber', 'numero de serie': 'serialNumber', 'n/s': 'serialNumber', 'serial': 'serialNumber', 'serie': 'serialNumber',
  'procesador': 'processor', 'ram': 'ram', 'memoria ram': 'ram',
  'tipo de almacenamiento': 'storageType', 'tipo de disco': 'storageType',
  'capacidad de almacenamiento': 'storage', 'almacenamiento': 'storage',
  'cantidad': 'quantity', 'cant': 'quantity',
  'ubicación': 'location', 'ubicacion': 'location', 'departamento': 'location', 'asignacion': 'location', 'asignación': 'location',
  'estado': 'status', 'notas adicionales': 'notes', 'notas': 'notes', 'observaciones': 'notes',
};

const mapExcelRowToInventoryItemFormValues = (row: ExcelInventoryItemData): Partial<z.infer<typeof BaseInventoryItemSchema>> => {
  const mapped: Partial<z.infer<typeof BaseInventoryItemSchema>> = {};
  for (const excelHeader in row) {
    const lowerExcelHeader = excelHeader.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const internalField = excelToInternalFieldMap[lowerExcelHeader] as keyof z.infer<typeof BaseInventoryItemSchema>;
    if (internalField) {
      let value = row[excelHeader];
      if (internalField === 'quantity' && typeof value === 'string') {
        const parsedQuantity = parseInt(value, 10);
        (mapped as any)[internalField] = isNaN(parsedQuantity) ? undefined : parsedQuantity;
      } else if (['category', 'status', 'ram', 'storageType'].includes(internalField)) {
        const normalizedValue = String(value).toLowerCase().replace(/\s/g,"").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const options = internalField === 'category' ? INVENTORY_ITEM_CATEGORIES :
                        internalField === 'status' ? INVENTORY_ITEM_STATUSES :
                        internalField === 'ram' ? RAM_OPTIONS : STORAGE_TYPES_ZOD_ENUM;
        const foundValue = (options as readonly string[]).find(opt => opt.toLowerCase().replace(/\s/g,"").normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedValue);
        (mapped as any)[internalField] = foundValue || undefined;
      } else {
         (mapped as any)[internalField] = value === null || value === undefined ? undefined : String(value).trim();
      }
    }
  }
  if (mapped.quantity === undefined || isNaN(Number(mapped.quantity))) mapped.quantity = 1;
  if (mapped.status === undefined) mapped.status = "En Uso";
  return mapped;
};

export async function importInventoryItemsAction(
  itemDataArray: ExcelInventoryItemData[],
  currentUserEmail: string,
  currentUserId: string,
  currentUserName: string
) {
  try {
    let successCount = 0;
    let errorCount = 0;
    const errors: { row: number; message: string; data: ExcelInventoryItemData }[] = [];
    const importedItems: InventoryItem[] = [];

    if (!itemDataArray || itemDataArray.length === 0) {
      return { success: false, message: "No se proporcionaron datos para importar o el archivo está vacío.", successCount, errorCount: itemDataArray?.length || 0, errors: [{ row: 0, message: "Archivo vacío o sin datos.", data: {} }], importedItems };
    }

    for (let i = 0; i < itemDataArray.length; i++) {
      try {
        const rawRow = itemDataArray[i];
        const mappedData = mapExcelRowToInventoryItemFormValues(rawRow);
        const validatedFields = BaseInventoryItemSchema.safeParse(mappedData);

        if (!validatedFields.success) {
          errorCount++;
          const fieldErrors = validatedFields.error.flatten().fieldErrors;
          const errorMessage = Object.entries(fieldErrors)
            .map(([field, messages]) => `${field}: ${(messages || ['Error desconocido']).join(', ')}`)
            .join('; ') || "Error de validación desconocido.";
          errors.push({ row: i + 2, message: errorMessage, data: rawRow });
          continue;
        }

        const data = validatedFields.data;
        const prefix = categoryPrefixMap[data.category as InventoryItemCategory];
        if (!prefix) throw new Error(`Categoría '${data.category}' no tiene un prefijo definido o no es válida.`);
        
        const allItems = getRawInventoryStore();
        let maxNum = 0;
        allItems.forEach(item => {
          if (item.id.startsWith(`${prefix}-IEQ-`)) {
            try {
              const numPart = parseInt(item.id.substring(item.id.lastIndexOf('-') + 1), 10);
              if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
            } catch (e) { /* ignore */ }
          }
        });
        const newNum = maxNum + 1;
        const formattedNum = String(newNum).padStart(3, '0');
        const newId = `${prefix}-IEQ-${formattedNum}`;
        const newItem: InventoryItem = {
          id: newId, ...data, category: data.category as InventoryItemCategory, status: data.status as InventoryItemStatus,
          addedByUserId: currentUserId, addedByUserName: currentUserName, createdAt: new Date(), updatedAt: new Date(),
        };
        if (newItem.category !== "Computadora") {
          newItem.ram = undefined; newItem.storageType = undefined; newItem.storage = undefined; newItem.processor = undefined;
        } else {
          newItem.ram = data.ram === "No Especificado" ? undefined : data.ram;
        }
        addInventoryItemToMock(newItem);
        importedItems.push(newItem);
        successCount++;
      } catch (e: any) {
        errorCount++;
        errors.push({ row: i + 2, message: `Error procesando fila: ${e.message || String(e)}`, data: itemDataArray[i] });
        console.error(`Error procesando fila ${i + 2} del Excel:`, e, "Datos de la fila:", itemDataArray[i]);
      }
    }

    if (successCount > 0) await logAuditEvent(currentUserEmail, "Importación Masiva de Inventario", `Se importaron ${successCount} artículos. Errores: ${errorCount}.`);
    else if (errorCount > 0 && itemDataArray.length > 0) await logAuditEvent(currentUserEmail, "Intento Fallido de Importación Masiva de Inventario", `No se importaron artículos. Errores: ${errorCount} de ${itemDataArray.length} filas.`);
    
    revalidatePath("/inventory");
    return { success: successCount > 0 && errorCount === 0, message: `Importación completada. ${successCount} artículos importados, ${errorCount} filas con errores.`, successCount, errorCount, errors, importedItems };
  } catch (e: any) {
    console.error("Error catastrófico durante la importación de inventario:", e);
    const errorMsg = `Error general del servidor durante la importación: ${e.message || 'Error desconocido'}. Revise los logs del servidor.`;
    return { success: false, message: errorMsg, successCount: 0, errorCount: itemDataArray?.length || 0, errors: itemDataArray?.map((row, index) => ({ row: index + 2, message: errorMsg, data: row })) || [{ row: 0, message: errorMsg, data: {} }], importedItems: [] };
  }
}


// --- Approval Actions (Placeholders for now) ---

const CreateApprovalRequestSchema = z.object({
  type: z.enum(["Compra", "PagoProveedor"] as [ApprovalRequestType, ...ApprovalRequestType[]]),
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres.").max(100),
  description: z.string().max(2000).optional(),
  // Add more fields based on type later, like amount, itemDescription etc.
  requesterId: z.string(),
  requesterName: z.string(),
  requesterEmail: z.string().email().optional(),
});

export async function createApprovalRequestAction(
  values: z.infer<typeof CreateApprovalRequestSchema>
): Promise<{ success: boolean; message: string; approvalId?: string; errors?: any }> {
  const validatedFields = CreateApprovalRequestSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Errores de validación." };
  }

  const { type, subject, description, requesterId, requesterName, requesterEmail } = validatedFields.data;
  
  const newApproval: ApprovalRequest = {
    id: `APR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    subject,
    description,
    status: "Pendiente",
    requesterId,
    requesterName,
    requesterEmail,
    createdAt: new Date(),
    updatedAt: new Date(),
    attachments: [], // Placeholder
    activityLog: [
      {
        id: `ACT-${Date.now()}`,
        action: "Solicitud Enviada",
        userId: requesterId,
        userName: requesterName,
        timestamp: new Date(),
      }
    ],
    // Add other type-specific fields with default or undefined values
  };

  addApprovalRequestToMock(newApproval);

  if (requesterEmail) {
    await logAuditEvent(requesterEmail, `Creación de Solicitud de Aprobación (${type})`, `ID: ${newApproval.id}, Asunto: ${subject}`);
  }
  
  revalidatePath("/approvals");
  // Potentially revalidate dashboard for President if they see pending approvals there
  revalidatePath("/dashboard"); 

  return {
    success: true,
    message: `Solicitud de ${type === "Compra" ? "Compra" : "Pago a Proveedores"} enviada exitosamente.`,
    approvalId: newApproval.id,
  };
}


// Placeholder - to be expanded
export async function getApprovalRequestsForUser(userId: string, userRole: Role): Promise<ApprovalRequest[]> {
  const allRequests = getAllApprovalRequestsFromMock();
  if (userRole === "Presidente IEQ") {
    // President sees all pending requests
    return allRequests.filter(req => req.status === "Pendiente");
  }
  // Other users (including Admin for now, or specific approvers) might see requests they created
  // or requests assigned to them if we add that logic
  return allRequests.filter(req => req.requesterId === userId);
}

export async function getApprovalRequestDetails(id: string): Promise<ApprovalRequest | null> {
    return getApprovalRequestByIdFromMock(id);
}

// More actions will be needed for approve, reject, request info, add attachments, etc.
