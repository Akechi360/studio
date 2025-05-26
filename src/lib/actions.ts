
"use server";

import { z } from "zod";
import type { Ticket, Comment, TicketPriority, TicketStatus, User, InventoryItem, InventoryItemCategory, InventoryItemStatus, StorageType, ExcelInventoryItemData, ApprovalRequest, ApprovalRequestType, ApprovalStatus as ApprovalStatusType, Role as UserRole, AttachmentClientData, Attachment, PaymentInstallment, PaymentType, CasoDeMantenimiento, CasoMantenimientoStatus, CasoMantenimientoPriority, CasoMantenimientoLogEntry } from "./types";
import type { AuditLogEntry as AuditLogEntryType } from "@/lib/types";
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
  addApprovalRequestToMock,
  getAllApprovalRequestsFromMock,
  getApprovalRequestByIdFromMock,
  updateApprovalRequestInMock,
  addCasoMantenimientoToMock,
  getAllCasosMantenimientoFromMock,
  getCasoMantenimientoByIdFromMock,
  updateCasoMantenimientoInMock,
} from "./mock-data";
import { revalidatePath } from "next/cache";
import { TICKET_PRIORITIES_ENGLISH, TICKET_STATUSES_ENGLISH } from "./constants";
import { 
  INVENTORY_ITEM_CATEGORIES, 
  INVENTORY_ITEM_STATUSES, 
  RAM_OPTIONS, 
  STORAGE_TYPES_ZOD_ENUM, 
  CASO_STATUSES, 
  CASO_PRIORITIES 
} from "./types";
import {
  BaseInventoryItemSchema,
  CreateApprovalRequestActionSchema,
  ApprovePagoProveedorContadoSchema,
  ApprovePagoProveedorCuotasSchema,
  ApproveCompraSchema,
  RejectOrInfoActionSchema,
  CreateCasoMantenimientoFormSchema,
  UpdateCasoMantenimientoFormSchema
} from "../lib/schemas"; // Import from new schemas file
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
    // Depending on requirements, you might want to throw the error or handle it silently
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
  if (userEmail) {
    await logAuditEvent(userEmail, "Creación de Ticket", `Ticket ID: ${newTicket.id}, Asunto: ${subject}`);
  }
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${newTicket.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/analytics");
  revalidatePath("/approvals");


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
  commenter: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>,
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
  if(currentUser.email){
    await logAuditEvent(currentUser.email, "Adición de Artículo de Inventario", `Artículo ID: ${newItem.id}, Nombre: ${newItem.name}`);
  }
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
  if (!itemToUpdate) {
    return { success: false, message: "Artículo no encontrado." };
  }
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
  'categoría': 'category', 'categoria': 'category',
  'marca': 'brand',
  'modelo': 'model',
  'número de serie': 'serialNumber', 'numero de serie': 'serialNumber', 'n/s': 'serialNumber', 'serial': 'serialNumber', 'serie': 'serialNumber',
  'procesador': 'processor',
  'ram': 'ram', 'memoria ram': 'ram',
  'tipo de almacenamiento': 'storageType', 'tipo de disco': 'storageType',
  'capacidad de almacenamiento': 'storage', 'almacenamiento': 'storage',
  'cantidad': 'quantity', 'cant': 'quantity',
  'ubicación': 'location', 'ubicacion': 'location', 'departamento': 'location', 'asignacion': 'location', 'asignación': 'location',
  'estado': 'status',
  'notas adicionales': 'notes', 'notas': 'notes', 'observaciones': 'notes',
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
): Promise<{ success: boolean; message: string; successCount: number; errorCount: number; errors: { row: number; message: string; data: ExcelInventoryItemData }[]; importedItems: InventoryItem[] }> {
  try {
    if (!itemDataArray || itemDataArray.length === 0) {
      return { success: false, message: "No se proporcionaron datos para importar o el archivo está vacío.", successCount: 0, errorCount: itemDataArray?.length || 0, errors: [{ row: 0, message: "Archivo vacío o sin datos.", data: {} }], importedItems: [] };
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: { row: number; message: string; data: ExcelInventoryItemData }[] = [];
    const importedItems: InventoryItem[] = [];

    for (let i = 0; i < itemDataArray.length; i++) {
      try {
        const rawRow = itemDataArray[i];
        const mappedData = mapExcelRowToInventoryItemFormValues(rawRow);
        const validatedFields = BaseInventoryItemSchema.safeParse(mappedData);

        if (!validatedFields.success) {
          errorCount++;
          const fieldErrors = validatedFields.error.flatten().fieldErrors as Record<string, string[] | undefined>;
           let errorMessage = Object.entries(fieldErrors)
            .map(([field, messages]) => `${field}: ${(messages || ['Error desconocido']).join(', ')}`)
            .join('; ') || "Error desconocido en validación.";
          
          if (fieldErrors.category && mappedData.category && !INVENTORY_ITEM_CATEGORIES.includes(mappedData.category as InventoryItemCategory) ) errorMessage = `Categoría "${mappedData.category}" no es válida. Valores permitidos: ${INVENTORY_ITEM_CATEGORIES.join(', ')}.`;
          else if (fieldErrors.status && mappedData.status && !INVENTORY_ITEM_STATUSES.includes(mappedData.status as InventoryItemStatus)) errorMessage = `Estado "${mappedData.status}" no es válido. Valores permitidos: ${INVENTORY_ITEM_STATUSES.join(', ')}.`;

          errors.push({ row: i + 2, message: `Error de validación: ${errorMessage}`, data: rawRow });
          continue;
        }

        const data = validatedFields.data;
        const prefix = categoryPrefixMap[data.category as InventoryItemCategory];
         if (!prefix) { 
            errorCount++;
            errors.push({ row: i + 2, message: `Categoría "${data.category}" no tiene un prefijo definido o no es válida.`, data: rawRow });
            continue;
        }


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
      }
    }

    if (successCount > 0) await logAuditEvent(currentUserEmail, "Importación Masiva de Inventario", `Se importaron ${successCount} artículos. Errores: ${errorCount}.`);
    else if (errorCount > 0 && itemDataArray.length > 0) await logAuditEvent(currentUserEmail, "Intento Fallido de Importación Masiva de Inventario", `No se importaron artículos. Errores: ${errorCount} de ${itemDataArray.length} filas.`);

    revalidatePath("/inventory");
    
    const importFullySuccessful = successCount > 0 && errorCount === 0;
    let finalMessage = "";
    if (successCount > 0 && errorCount > 0) {
        finalMessage = `Importación parcial: ${successCount} artículos importados. ${errorCount} filas con errores.`;
    } else if (errorCount > 0) {
        finalMessage = `Importación fallida: ${errorCount} filas con errores. No se importaron artículos.`;
    } else if (successCount > 0) {
        finalMessage = `Importación completada: ${successCount} artículos importados exitosamente.`;
    } else {
        finalMessage = "No se procesaron datos. El archivo podría estar vacío o mal formateado.";
    }

    return { success: importFullySuccessful, message: finalMessage, successCount, errorCount, errors, importedItems };
  } catch (e: any) {
    const errorMsg = `Error general del servidor durante la importación: ${e.message || 'Error desconocido'}.`;
    console.error("Error crítico en importInventoryItemsAction:", e);
    await logAuditEvent(currentUserEmail, "Error Crítico en Importación Masiva de Inventario", errorMsg);
    return { success: false, message: errorMsg, successCount: 0, errorCount: itemDataArray?.length || 0, errors: itemDataArray?.map((row, index) => ({ row: index + 2, message: "Error catastrófico del servidor.", data: row })) || [{ row: 0, message: "Error catastrófico del servidor.", data: {} }], importedItems: [] };
  }
}


// --- Approval Actions ---
export async function createApprovalRequestAction(
  values: z.infer<typeof CreateApprovalRequestActionSchema>
): Promise<{ success: boolean; message: string; approvalId?: string; errors?: any }> {
  const validatedFields = CreateApprovalRequestActionSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Errores de validación." };
  }

  const data = validatedFields.data;

  const newAttachments: Attachment[] = (data.attachmentsData || []).map(attData => ({
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    fileName: attData.fileName,
    size: attData.size,
    type: attData.type,
    url: `/uploads/mock/${attData.fileName}`, 
  }));

  const newApproval: ApprovalRequest = {
    id: `APR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: data.type,
    subject: data.subject,
    description: data.description,
    status: "Pendiente",
    requesterId: data.requesterId,
    requesterName: data.requesterName,
    requesterEmail: data.requesterEmail,
    createdAt: new Date(),
    updatedAt: new Date(),
    attachments: newAttachments,
    activityLog: [
      {
        id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        action: "Solicitud Enviada",
        userId: data.requesterId,
        userName: data.requesterName,
        timestamp: new Date(),
      }
    ],
  };

  if (data.type === "Compra") {
    newApproval.itemDescription = data.itemDescription;
    newApproval.estimatedPrice = data.estimatedPrice;
    newApproval.supplierCompra = data.supplierCompra;
  } else if (data.type === "PagoProveedor") {
    newApproval.supplierPago = data.supplierPago;
    newApproval.totalAmountToPay = data.totalAmountToPay;
  }

  addApprovalRequestToMock(newApproval);

  if (data.requesterEmail) {
    await logAuditEvent(data.requesterEmail, `Creación de Solicitud de Aprobación (${data.type})`, `ID: ${newApproval.id}, Asunto: ${data.subject}`);
  }

  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/approvals/[id]", "page");


  return {
    success: true,
    message: `Solicitud de ${data.type === "Compra" ? "Compra" : "Pago a Proveedores"} enviada exitosamente.`,
    approvalId: newApproval.id,
  };
}


export async function getApprovalRequestsForUser(userId: string, userRole: UserRole): Promise<ApprovalRequest[]> {
  const allRequests = getAllApprovalRequestsFromMock();
  if (userRole === "Presidente IEQ") {
    return allRequests.filter(req => req.status === "Pendiente" || req.status === "InformacionSolicitada");
  }
  return allRequests.filter(req => req.requesterId === userId);
}

export async function getApprovalRequestDetails(id: string): Promise<ApprovalRequest | null> {
    return getApprovalRequestByIdFromMock(id);
}

export async function approveRequestAction(
  values: any 
): Promise<{ success: boolean; message: string }> {
  const request = getApprovalRequestByIdFromMock(values.requestId);
  if (!request) return { success: false, message: "Solicitud no encontrada." };

  let validatedData;
  if (request.type === "PagoProveedor") {
    if (values.approvedPaymentType === 'Contado') {
      const result = ApprovePagoProveedorContadoSchema.safeParse(values);
      if (!result.success) return { success: false, message: result.error.flatten().fieldErrors.approvedAmount?.[0] || "Error de validación de pago de contado." };
      validatedData = result.data;
    } else if (values.approvedPaymentType === 'Cuotas') {
      const result = ApprovePagoProveedorCuotasSchema.safeParse(values);
      if (!result.success) return { success: false, message: result.error.flatten().fieldErrors.installments?.[0] || result.error.flatten().formErrors[0] || "Error de validación de pago por cuotas." };
      validatedData = result.data;
    } else {
      return { success: false, message: "Tipo de pago para aprobación no válido." };
    }
  } else { 
    const result = ApproveCompraSchema.safeParse(values);
    if (!result.success) return { success: false, message: "Error de validación de aprobación de compra." };
    validatedData = result.data;
  }

  const { requestId, approverId, approverName, approverEmail, comment } = validatedData;

  const updatedRequestData: Partial<ApprovalRequest> = {
    status: "Aprobado",
    approverId,
    approverName,
    approverComment: comment,
    approvedAt: new Date(),
  };

  if (request.type === "PagoProveedor") {
    updatedRequestData.approvedPaymentType = validatedData.approvedPaymentType as PaymentType;
    updatedRequestData.approvedAmount = validatedData.approvedAmount;
    if (validatedData.approvedPaymentType === 'Cuotas') {
      updatedRequestData.paymentInstallments = validatedData.installments;
    } else {
      updatedRequestData.paymentInstallments = []; 
    }
  }

  updateApprovalRequestInMock({ ...request, ...updatedRequestData } as ApprovalRequest);
  await logAuditEvent(approverEmail, "Aprobación de Solicitud", `ID Solicitud: ${requestId}, Aprobador: ${approverName}. Comentario: ${comment || 'N/A'}. Tipo Pago: ${updatedRequestData.approvedPaymentType || 'N/A'}`);
  revalidatePath(`/approvals/${requestId}`);
  revalidatePath('/approvals');
  revalidatePath('/dashboard');
  return { success: true, message: "Solicitud aprobada." };
}

export async function rejectRequestAction(
  values: z.infer<typeof RejectOrInfoActionSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = RejectOrInfoActionSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.flatten().fieldErrors.comment?.[0] || "Error de validación." };
  }
  const { requestId, approverId, approverName, approverEmail, comment } = validatedFields.data;
  const request = getApprovalRequestByIdFromMock(requestId);
  if (!request) return { success: false, message: "Solicitud no encontrada." };

  const updatedRequestData: Partial<ApprovalRequest> = {
    status: "Rechazado",
    approverId,
    approverName,
    approverComment: comment,
    rejectedAt: new Date(),
  };
  updateApprovalRequestInMock({ ...request, ...updatedRequestData } as ApprovalRequest);
  await logAuditEvent(approverEmail, "Rechazo de Solicitud", `ID Solicitud: ${requestId}, Aprobador: ${approverName}. Comentario: ${comment}`);
  revalidatePath(`/approvals/${requestId}`);
  revalidatePath('/approvals');
  revalidatePath('/dashboard');
  return { success: true, message: "Solicitud rechazada." };
}

export async function requestMoreInfoAction(
  values: z.infer<typeof RejectOrInfoActionSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = RejectOrInfoActionSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.flatten().fieldErrors.comment?.[0] || "Error de validación." };
  }
  const { requestId, approverId, approverName, approverEmail, comment } = validatedFields.data;
  const request = getApprovalRequestByIdFromMock(requestId);
  if (!request) return { success: false, message: "Solicitud no encontrada." };

  const updatedRequestData: Partial<ApprovalRequest> = {
    status: "InformacionSolicitada",
    approverId,
    approverName,
    approverComment: comment,
    infoRequestedAt: new Date(),
  };
  updateApprovalRequestInMock({ ...request, ...updatedRequestData } as ApprovalRequest);
  await logAuditEvent(approverEmail, "Solicitud de Más Información", `ID Solicitud: ${requestId}, Aprobador: ${approverName}. Comentario: ${comment}`);
  revalidatePath(`/approvals/${requestId}`);
  revalidatePath('/approvals');
  revalidatePath('/dashboard');
  return { success: true, message: "Se solicitó más información." };
}

// --- Gestión de Casos de Mantenimiento Actions ---
export async function createCasoMantenimientoAction(
  values: z.infer<typeof CreateCasoMantenimientoFormSchema>,
  currentUserId: string,
  currentUserName: string,
  currentUserEmail: string
): Promise<{ success: boolean; message: string; casoId?: string; errors?: any }> {
  const validatedFields = CreateCasoMantenimientoFormSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Errores de validación al crear el caso." };
  }
  const data = validatedFields.data;

  const newCaso: CasoDeMantenimiento = {
    id: `CASO-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: data.title,
    description: data.description,
    location: data.location,
    equipment: data.equipment,
    priority: data.priority,
    assignedProviderName: data.assignedProviderName,
    registeredByUserId: currentUserId,
    registeredByUserName: currentUserName,
    registeredAt: new Date(),
    currentStatus: 'Registrado',
    log: [
      {
        timestamp: new Date(),
        action: 'Caso Registrado',
        notes: 'Caso de mantenimiento inicial registrado.',
        userId: currentUserId,
        userName: currentUserName,
        statusAfterAction: 'Registrado',
      },
    ],
    providerContactPerson: undefined,
    expectedResolutionDate: undefined,
    lastFollowUpDate: undefined,
    nextFollowUpDate: undefined,
    resolutionDetails: undefined,
    cost: undefined,
    invoicingDetails: undefined,
    resolvedAt: undefined,
  };

  addCasoMantenimientoToMock(newCaso);
  await logAuditEvent(currentUserEmail, "Registro de Nuevo Caso de Mantenimiento", `ID Caso: ${newCaso.id}, Título: ${newCaso.title}`);
  revalidatePath("/mantenimiento");

  return {
    success: true,
    message: "Caso de mantenimiento registrado exitosamente.",
    casoId: newCaso.id,
  };
}

export async function getAllCasosMantenimientoAction(): Promise<CasoDeMantenimiento[]> {
  return getAllCasosMantenimientoFromMock();
}

export async function getCasoMantenimientoByIdAction(id: string): Promise<CasoDeMantenimiento | null> {
  return getCasoMantenimientoByIdFromMock(id);
}

export async function updateCasoMantenimientoAction(
  casoId: string,
  updates: z.infer<typeof UpdateCasoMantenimientoFormSchema>,
  actingUserId: string,
  actingUserName: string,
  actingUserEmail: string
): Promise<{ success: boolean; message: string; }> {
   const validatedFields = UpdateCasoMantenimientoFormSchema.safeParse(updates);
   if (!validatedFields.success) {
     return { success: false, message: "Error de validación: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) };
   }

   const caso = getCasoMantenimientoByIdFromMock(casoId);
   if (!caso) {
     return { success: false, message: "Caso de mantenimiento no encontrado." };
   }

   const { currentStatus, notes, assignedProviderName, nextFollowUpDate, resolutionDetails, cost, invoicingDetails, resolvedAt } = validatedFields.data;

   const newLogEntry: CasoMantenimientoLogEntry = {
     timestamp: new Date(),
     action: `Actualización de estado a: ${currentStatus}`,
     notes: notes,
     userId: actingUserId,
     userName: actingUserName,
     statusAfterAction: currentStatus,
   };

   const updatedCasoData: Partial<CasoDeMantenimiento> = {
     currentStatus,
     assignedProviderName,
     nextFollowUpDate,
     lastFollowUpDate: new Date(),
     log: [...caso.log, newLogEntry],
   };

   if (currentStatus === 'Resuelto') {
     updatedCasoData.resolutionDetails = resolutionDetails;
     updatedCasoData.cost = cost;
     updatedCasoData.invoicingDetails = invoicingDetails;
     updatedCasoData.resolvedAt = resolvedAt || new Date();
     if (!resolutionDetails || !resolvedAt) {
        return {success: false, message: "Para el estado 'Resuelto', los detalles de resolución y la fecha de resolución son obligatorios."}
     }
   } else {
      updatedCasoData.resolutionDetails = undefined;
      updatedCasoData.cost = undefined;
      updatedCasoData.invoicingDetails = undefined;
      updatedCasoData.resolvedAt = undefined;
   }
   
   const success = updateCasoMantenimientoInMock({ ...caso, ...updatedCasoData });
   
   if (success) {
       await logAuditEvent(actingUserEmail, `Actualización de Caso de Mantenimiento: ${newLogEntry.action}`, `ID Caso: ${casoId}. Notas: ${notes}`);
       revalidatePath(`/mantenimiento/${casoId}`);
       revalidatePath("/mantenimiento");
       return { success: true, message: `Caso de mantenimiento actualizado: ${newLogEntry.action}.` };
   } else {
       return { success: false, message: "No se pudo actualizar el caso de mantenimiento."};
   }
}

// --- AI Solution Suggestion ---
// Removed getAISolutionSuggestion as per user request

// --- GENKIT RELATED FLOWS ---
// AI Solution Suggestion Flow (suggest-solution.ts) is expected to be removed/empty.
// If you need to re-enable or add other Genkit flows, ensure they are correctly imported in src/ai/dev.ts.
