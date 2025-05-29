
"use server";

import { z } from "zod";
import type { Ticket, Comment, TicketPriority, TicketStatus, User, InventoryItem, InventoryItemCategory, InventoryItemStatus, StorageType, ExcelInventoryItemData, ApprovalRequest, ApprovalRequestType, ApprovalStatus as ApprovalStatusType, Role as UserRole, AttachmentClientData, Attachment, PaymentInstallment, PaymentType, CasoDeMantenimiento, CasoMantenimientoStatus, CasoMantenimientoPriority, CasoMantenimientoLogEntry } from "./types";
import type { AuditLogEntry as AuditLogEntryType } from "@/lib/types";
// Removed mock data imports as we are transitioning to Prisma
// import {
//   addTicketToMock,
//   getAllTicketsFromMock,
//   getTicketByIdFromMock,
//   getRawTicketsStoreForStats,
//   getAllInventoryItemsFromMock,
//   addInventoryItemToMock,
//   getRawInventoryStore,
//   updateInventoryItemInMock,
//   deleteInventoryItemFromMock,
//   getInventoryItemByIdFromMock,
//   addAuditLogEntryToMock,
//   getAllAuditLogsFromMock,
//   addApprovalRequestToMock,
//   getAllApprovalRequestsFromMock,
//   getApprovalRequestByIdFromMock,
//   updateApprovalRequestInMock,
//   addCasoMantenimientoToMock,
//   getAllCasosMantenimientoFromMock,
//   getCasoMantenimientoByIdFromMock,
//   updateCasoMantenimientoInMock,
// } from "./mock-data";
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
} from "../lib/schemas"; 
import * as XLSX from 'xlsx';

// TODO: Initialize Prisma Client (typically in a separate db.ts file and import it here)
// import prisma from './db'; 

// --- Audit Log Actions ---
export async function logAuditEvent(performingUserEmail: string, actionDescription: string, details?: string): Promise<void> {
  try {
    // TODO: Implement using Prisma client
    // await prisma.auditLogEntry.create({
    //   data: {
    //     userEmail: performingUserEmail,
    //     action: actionDescription,
    //     details: details || undefined,
    //   }
    // });
    console.warn(`Audit Event (needs Prisma): User: ${performingUserEmail}, Action: ${actionDescription}, Details: ${details}`);
    revalidatePath("/admin/audit"); // This might still be useful
  } catch (error) {
    console.error("Error logging audit event (Prisma TODO):", error);
  }
}

export async function getAuditLogs(): Promise<AuditLogEntryType[]> {
  // TODO: Implement using Prisma client
  // const logs = await prisma.auditLogEntry.findMany({ orderBy: { timestamp: 'desc' } });
  // return logs;
  console.warn("getAuditLogs needs Prisma implementation.");
  return [];
}

// --- Ticket Creation ---
const CreateTicketSchema = z.object({
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  priority: z.enum(TICKET_PRIORITIES_ENGLISH as [TicketPriority, ...TicketPriority[]]),
  userEmail: z.string().email("Debe ser un correo electrónico válido para el usuario que crea el ticket.")
});

export async function createTicketAction(
  userId: string, // This would be the authenticated user's ID from your session/db
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

  // TODO: Implement using Prisma client
  // const newTicket = await prisma.ticket.create({
  //   data: {
  //     subject,
  //     description,
  //     priority,
  //     status: "Open",
  //     userId, // This should link to the User model via foreign key
  //     userName, // Denormalized, or fetched via relation
  //     userEmail,
  //     // attachments and comments would be handled via relational inserts if needed
  //   }
  // });
  const placeholderTicketId = `TICKET-DB-${Date.now()}`;
  console.warn(`createTicketAction needs Prisma implementation. Placeholder ID: ${placeholderTicketId}`);

  if (userEmail) {
    await logAuditEvent(userEmail, "Creación de Ticket", `Ticket Asunto: ${subject}`);
  }
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${placeholderTicketId}`); // Adjust if ID generation changes
  revalidatePath("/dashboard");
  revalidatePath("/admin/analytics");

  return {
    success: true,
    message: "¡Ticket creado exitosamente! (Implementación DB pendiente)",
    ticketId: placeholderTicketId,
  };
}

// --- Add Comment ---
const AddCommentSchema = z.object({
  text: z.string().min(1, "El comentario no puede estar vacío."),
});

export async function addCommentAction(
  ticketId: string,
  commenter: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>, // User object from session/db
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

  // TODO: Implement using Prisma client
  // const newComment = await prisma.comment.create({
  //   data: {
  //     text: validatedFields.data.text,
  //     ticketId,
  //     userId: commenter.id,
  //     userName: commenter.name,
  //     userAvatarUrl: commenter.avatarUrl,
  //   }
  // });
  // await prisma.ticket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } });
  const placeholderCommentId = `COMMENT-DB-${Date.now()}`;
  console.warn(`addCommentAction needs Prisma implementation. Placeholder ID: ${placeholderCommentId}`);


  if (commenter.email) {
    await logAuditEvent(commenter.email, "Adición de Comentario", `Ticket ID: ${ticketId}, Usuario: ${commenter.name}`);
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  revalidatePath("/admin/analytics");

  return {
    success: true,
    message: "¡Comentario añadido exitosamente! (Implementación DB pendiente)",
    // comment: newComment, // Return the actual comment object from Prisma
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
  const { status, actingUserEmail } = validatedFields.data;

  // TODO: Implement using Prisma client
  // const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  // if (!ticket) return { success: false, message: "Ticket no encontrado." };
  // const oldStatus = ticket.status;
  // await prisma.ticket.update({
  //   where: { id: ticketId },
  //   data: { status, updatedAt: new Date() }
  // });
  const oldStatusPlaceholder = "Open"; // Placeholder
  console.warn(`updateTicketStatusAction needs Prisma implementation for ticket ${ticketId}.`);

  await logAuditEvent(actingUserEmail, "Actualización de Estado de Ticket", `Ticket ID: ${ticketId}, De: ${oldStatusPlaceholder}, A: ${status}`);
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  revalidatePath("/admin/analytics");

  const statusDisplayMap: Record<TicketStatus, string> = {
    Open: "Abierto", "In Progress": "En Progreso", Resolved: "Resuelto", Closed: "Cerrado",
  };
  return { success: true, message: `Estado del ticket actualizado a ${statusDisplayMap[status as TicketStatus]}. (Implementación DB pendiente)` };
}

// --- Fetch Ticket by ID ---
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  // TODO: Implement using Prisma client
  // const ticket = await prisma.ticket.findUnique({
  //   where: { id: ticketId },
  //   include: { comments: true, attachments: true, user: true } // Example includes
  // });
  // return ticket;
  console.warn(`getTicketById needs Prisma implementation for ticket ${ticketId}.`);
  return null;
}

// --- Fetch All Tickets ---
export async function getAllTickets(): Promise<Ticket[]> {
  // TODO: Implement using Prisma client
  // const tickets = await prisma.ticket.findMany({
  //   orderBy: { createdAt: 'desc' },
  //   include: { user: true, comments: true, attachments: true } // Example includes
  // });
  // return tickets;
  console.warn("getAllTickets needs Prisma implementation.");
  return [];
}

// --- Fetch Dashboard Stats ---
export async function getDashboardStats() {
  // TODO: Implement using Prisma client with aggregate queries
  // const total = await prisma.ticket.count();
  // const open = await prisma.ticket.count({ where: { status: "Open" } });
  // ... and so on for other statuses and priorities
  console.warn("getDashboardStats needs Prisma implementation.");
  const placeholderSummary = { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
  const placeholderStats = { 
    byPriority: (TICKET_PRIORITIES_ENGLISH).map(pKey  => ({ name: pKey, value: 0 })),
    byStatus: (TICKET_STATUSES_ENGLISH).map(sKey => ({ name: sKey, value: 0 }))
  };
  return { summary: placeholderSummary, stats: placeholderStats };
}

// --- Inventory Actions ---
export async function getAllInventoryItems(): Promise<InventoryItem[]> {
  // TODO: Implement using Prisma client
  // const items = await prisma.inventoryItem.findMany({ orderBy: { createdAt: 'desc' } });
  // return items;
  console.warn("getAllInventoryItems needs Prisma implementation.");
  return [];
}

const categoryPrefixMap: Record<InventoryItemCategory, string> = {
  Computadora: "PC", Monitor: "MON", Teclado: "TEC", Mouse: "MOU", Impresora: "IMP", Escaner: "ESC",
  Router: "ROU", Switch: "SWI", Servidor: "SRV", Laptop: "LAP", Tablet: "TAB", Proyector: "PRO",
  "TelefonoIP": "TIP", "OtroPeriferico": "PER", Software: "SOF", Licencia: "LIC", Otro: "OTR",
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
  
  // TODO: ID generation logic needs to be database-aware (e.g., query max number for prefix)
  // This mock logic for ID generation will not work reliably with a DB.
  // let maxNum = 0; // Query DB: await prisma.inventoryItem.findFirst({ where: { id: { startsWith: `${prefix}-IEQ-` } }, orderBy: { id: 'desc' } })
  const newNum = 1; // Placeholder
  const formattedNum = String(newNum).padStart(3, '0');
  const newId = `${prefix}-IEQ-${formattedNum}`;
  
  // TODO: Implement using Prisma client
  // const newItem = await prisma.inventoryItem.create({
  //   data: {
  //     id: newId, ...data,
  //     category: data.category as InventoryItemCategory, status: data.status as InventoryItemStatus,
  //     addedByUserId: currentUser.id, addedByUserName: currentUser.name,
  //     // ensure date fields are Date objects if Prisma expects them
  //   }
  // });
  console.warn(`addInventoryItemAction needs Prisma implementation. Placeholder ID: ${newId}`);
  
  if(currentUser.email){
    await logAuditEvent(currentUser.email, "Adición de Artículo de Inventario", `Artículo ID: ${newId}, Nombre: ${data.name}`);
  }
  revalidatePath("/inventory");
  return { success: true, message: `Artículo "${data.name}" con ID "${newId}" añadido exitosamente. (DB Pendiente)`, item: {id: newId, ...data} as any };
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
  // TODO: Implement using Prisma client
  // const itemToUpdate = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  // if (!itemToUpdate) return { success: false, message: "Artículo no encontrado." };
  // const updatedItem = await prisma.inventoryItem.update({
  //   where: { id: itemId },
  //   data: { ...validatedFields.data, category: validatedFields.data.category as InventoryItemCategory, status: validatedFields.data.status as InventoryItemStatus, updatedAt: new Date() }
  // });
  console.warn(`updateInventoryItemAction needs Prisma implementation for item ${itemId}.`);

  await logAuditEvent(actingUserEmail, "Actualización de Artículo de Inventario", `Artículo ID: ${itemId}, Nombre: ${validatedFields.data.name}`);
  revalidatePath("/inventory");
  return { success: true, message: `Artículo "${validatedFields.data.name}" actualizado exitosamente. (DB Pendiente)` };
}

export async function deleteInventoryItemAction(itemId: string, actingUserEmail: string) {
  // TODO: Implement using Prisma client
  // const itemToDelete = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  // if (!itemToDelete) return { success: false, message: "Artículo no encontrado para eliminar." };
  // await prisma.inventoryItem.delete({ where: { id: itemId } });
  const placeholderItemName = "Artículo Desconocido"; // Fetch name before delete
  console.warn(`deleteInventoryItemAction needs Prisma implementation for item ${itemId}.`);

  await logAuditEvent(actingUserEmail, "Eliminación de Artículo de Inventario", `Artículo ID: ${itemId}, Nombre: ${placeholderItemName}`);
  revalidatePath("/inventory");
  return { success: true, message: "Artículo eliminado exitosamente. (DB Pendiente)" };
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
  if (mapped.status === undefined) mapped.status = "EnUso" as InventoryItemStatus; // Prisma enum uses EnUso
  return mapped;
};


export async function importInventoryItemsAction(
  itemDataArray: ExcelInventoryItemData[],
  currentUserEmail: string,
  currentUserId: string,
  currentUserName: string
): Promise<{ success: boolean; message: string; successCount: number; errorCount: number; errors: { row: number; message: string; data: ExcelInventoryItemData }[]; importedItems: InventoryItem[] }> {
  // TODO: This entire action needs to be refactored for Prisma.
  // The ID generation logic specifically needs a DB query for max sequence.
  // Consider batch inserts or transactions for performance and atomicity.
  console.warn("importInventoryItemsAction needs Prisma implementation.");
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
        // Simulate success for now
        successCount++;
        // importedItems.push(newItemFromDb); // Push actual item from DB
      } catch (e: any) {
        errorCount++;
        errors.push({ row: i + 2, message: `Error procesando fila: ${e.message || String(e)}`, data: itemDataArray[i] });
      }
    }

  if (successCount > 0) await logAuditEvent(currentUserEmail, "Importación Masiva de Inventario (DB Pendiente)", `Se intentarían importar ${successCount} artículos. Errores: ${errorCount}.`);
  else if (errorCount > 0 && itemDataArray.length > 0) await logAuditEvent(currentUserEmail, "Intento Fallido de Importación Masiva de Inventario (DB Pendiente)", `No se importaron artículos. Errores: ${errorCount} de ${itemDataArray.length} filas.`);
  
  revalidatePath("/inventory");
  return { success: successCount > 0 && errorCount === 0, message: `Importación (DB Pendiente): ${successCount} procesados, ${errorCount} errores.`, successCount, errorCount, errors, importedItems };
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
  // TODO: Implement using Prisma client
  // Handle attachments by creating Attachment records and linking them.
  const placeholderApprovalId = `APR-DB-${Date.now()}`;
  console.warn(`createApprovalRequestAction needs Prisma implementation. Placeholder ID: ${placeholderApprovalId}`);

  if (data.requesterEmail) {
    await logAuditEvent(data.requesterEmail, `Creación de Solicitud de Aprobación (${data.type})`, `Asunto: ${data.subject}`);
  }
  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/approvals/[id]", "page");

  return {
    success: true,
    message: `Solicitud de ${data.type === "Compra" ? "Compra" : "Pago a Proveedores"} enviada exitosamente. (DB Pendiente)`,
    approvalId: placeholderApprovalId,
  };
}

export async function getApprovalRequestsForUser(userId: string, userRole: UserRole): Promise<ApprovalRequest[]> {
  // TODO: Implement using Prisma client
  // if (userRole === "PresidenteIEQ") {
  //   return await prisma.approvalRequest.findMany({ where: { status: { in: ["Pendiente", "InformacionSolicitada"] } }, include: { requester: true }});
  // }
  // return await prisma.approvalRequest.findMany({ where: { requesterId: userId }, include: { requester: true }});
  console.warn("getApprovalRequestsForUser needs Prisma implementation.");
  return [];
}

export async function getApprovalRequestDetails(id: string): Promise<ApprovalRequest | null> {
  // TODO: Implement using Prisma client
  // return await prisma.approvalRequest.findUnique({
  //   where: { id },
  //   include: { requester: true, approver: true, attachments: true, activityLog: { include: { user: true }, orderBy: { timestamp: 'desc' } }, paymentInstallments: true }
  // });
  console.warn(`getApprovalRequestDetails needs Prisma implementation for ID ${id}.`);
  return null;
}

export async function approveRequestAction(
  values: any 
): Promise<{ success: boolean; message: string }> {
  // TODO: Full Prisma implementation needed here.
  // This includes fetching the request, validating, updating status,
  // creating activity log entries, and handling payment installments if applicable.
  console.warn("approveRequestAction needs Prisma implementation.");
  const { requestId, approverEmail, approverName, comment, approvedPaymentType } = values; // Simplified access

  await logAuditEvent(approverEmail, "Aprobación de Solicitud (DB Pendiente)", `ID Solicitud: ${requestId}, Aprobador: ${approverName}. Comentario: ${comment || 'N/A'}. Tipo Pago: ${approvedPaymentType || 'N/A'}`);
  revalidatePath(`/approvals/${requestId}`);
  revalidatePath('/approvals');
  revalidatePath('/dashboard');
  return { success: true, message: "Solicitud aprobada. (DB Pendiente)" };
}

export async function rejectRequestAction(
  values: z.infer<typeof RejectOrInfoActionSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = RejectOrInfoActionSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.flatten().fieldErrors.comment?.[0] || "Error de validación." };
  }
  // TODO: Prisma implementation
  console.warn("rejectRequestAction needs Prisma implementation.");
  const { requestId, approverEmail, approverName, comment } = validatedFields.data;
  await logAuditEvent(approverEmail, "Rechazo de Solicitud (DB Pendiente)", `ID Solicitud: ${requestId}, Aprobador: ${approverName}. Comentario: ${comment}`);
  revalidatePath(`/approvals/${requestId}`);
  revalidatePath('/approvals');
  revalidatePath('/dashboard');
  return { success: true, message: "Solicitud rechazada. (DB Pendiente)" };
}

export async function requestMoreInfoAction(
  values: z.infer<typeof RejectOrInfoActionSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = RejectOrInfoActionSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.flatten().fieldErrors.comment?.[0] || "Error de validación." };
  }
  // TODO: Prisma implementation
  console.warn("requestMoreInfoAction needs Prisma implementation.");
  const { requestId, approverEmail, approverName, comment } = validatedFields.data;
  await logAuditEvent(approverEmail, "Solicitud de Más Información (DB Pendiente)", `ID Solicitud: ${requestId}, Aprobador: ${approverName}. Comentario: ${comment}`);
  revalidatePath(`/approvals/${requestId}`);
  revalidatePath('/approvals');
  revalidatePath('/dashboard');
  return { success: true, message: "Se solicitó más información. (DB Pendiente)" };
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
  // TODO: Implement using Prisma client
  // Create CasoDeMantenimiento and initial CasoMantenimientoLogEntry
  const placeholderCasoId = `CASO-DB-${Date.now()}`;
  console.warn(`createCasoMantenimientoAction needs Prisma implementation. Placeholder ID: ${placeholderCasoId}`);

  await logAuditEvent(currentUserEmail, "Registro de Nuevo Caso de Mantenimiento (DB Pendiente)", `Título: ${values.title}`);
  revalidatePath("/mantenimiento");

  return {
    success: true,
    message: "Caso de mantenimiento registrado exitosamente. (DB Pendiente)",
    casoId: placeholderCasoId,
  };
}

export async function getAllCasosMantenimientoAction(): Promise<CasoDeMantenimiento[]> {
  // TODO: Implement using Prisma client
  // return await prisma.casoDeMantenimiento.findMany({ include: { registeredByUser: true, logEntries: true } });
  console.warn("getAllCasosMantenimientoAction needs Prisma implementation.");
  return [];
}

export async function getCasoMantenimientoByIdAction(id: string): Promise<CasoDeMantenimiento | null> {
  // TODO: Implement using Prisma client
  // return await prisma.casoDeMantenimiento.findUnique({ where: { id }, include: { registeredByUser: true, logEntries: { include: { user: true }, orderBy: { timestamp: 'desc' } } } });
  console.warn(`getCasoMantenimientoByIdAction needs Prisma implementation for ID ${id}.`);
  return null;
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
   // TODO: Implement using Prisma client
   // Fetch caso, update fields, add log entry transactionally.
   console.warn(`updateCasoMantenimientoAction needs Prisma implementation for caso ${casoId}.`);
   const { currentStatus, notes } = validatedFields.data;

   await logAuditEvent(actingUserEmail, `Actualización de Caso de Mantenimiento (DB Pendiente): ${currentStatus}`, `ID Caso: ${casoId}. Notas: ${notes}`);
   revalidatePath(`/mantenimiento/${casoId}`);
   revalidatePath("/mantenimiento");
   return { success: true, message: `Caso de mantenimiento actualizado: ${currentStatus}. (DB Pendiente)` };
}
