
"use server";

import { z } from "zod";
import type { Ticket as TicketType, Comment as CommentType, TicketPriority, TicketStatus, User as UserType, InventoryItem as InventoryItemType, InventoryItemCategory, InventoryItemStatus, StorageType, ExcelInventoryItemData, ApprovalRequest as ApprovalRequestTypePrisma, ApprovalRequestType as ApprovalRequestTypeEnum, ApprovalStatus as ApprovalStatusEnumType, Role as UserRoleEnum, Attachment as AttachmentTypePrisma, PaymentInstallment as PaymentInstallmentTypePrisma, PaymentType as PaymentTypeEnum, CasoDeMantenimiento as CasoDeMantenimientoTypePrisma, CasoMantenimientoStatus as CasoMantenimientoStatusEnum, CasoMantenimientoPriority as CasoMantenimientoPriorityEnum, CasoMantenimientoLogEntry as CasoMantenimientoLogEntryTypePrisma, AuditLogEntry as AuditLogEntryTypePrisma } from "@prisma/client";
import type { AttachmentClientData } from "./types";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TICKET_PRIORITIES_ENGLISH, TICKET_STATUSES_ENGLISH } from "./constants";
import { 
  INVENTORY_ITEM_CATEGORIES, 
  INVENTORY_ITEM_STATUSES, 
  RAM_OPTIONS, 
  STORAGE_TYPES_ZOD_ENUM, 
  CASO_STATUSES,
  CASO_PRIORITIES as CASO_PRIORITIES_TYPES,
  ApprovalStatus
} from "./types";
import {
  BaseInventoryItemSchema,
  CreateApprovalRequestActionSchema,
  ApprovePagoProveedorContadoSchema,
  ApprovePagoProveedorCuotasSchema,
  ApproveCompraSchema,
  RejectOrInfoActionSchema,
  CreateCasoMantenimientoFormSchema,
  UpdateCasoMantenimientoFormSchema,
} from "../lib/schemas";


// --- Audit Log Actions ---
export async function logAuditEvent(performingUserEmail: string, actionDescription: string, details?: string): Promise<void> {
  try {
    await prisma.auditLogEntry.create({
      data: {
        userEmail: performingUserEmail,
        action: actionDescription,
        details: details || undefined,
      }
    });
    revalidatePath("/admin/audit");
  } catch (error) {
    console.error("Error logging audit event:", error);
  }
}

export async function getAuditLogs(): Promise<AuditLogEntryTypePrisma[]> {
  try {
    const logs = await prisma.auditLogEntry.findMany({
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { name: true, email: true }} }
    });
    return logs;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}

// --- Ticket Schemas (remains client-side, but used by actions) ---
const CreateTicketSchema = z.object({
  subject: z.string().min(5).max(100),
  description: z.string().min(10).max(2000),
  priority: z.enum(TICKET_PRIORITIES_ENGLISH as [TicketPriority, ...TicketPriority[]]),
  userEmail: z.string().email(),
});

const AddCommentSchema = z.object({
  text: z.string().min(1).max(1000),
});

const UpdateTicketStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES_ENGLISH as [TicketStatus, ...TicketStatus[]]),
  actingUserEmail: z.string().email(),
});


// --- Ticket Creation ---
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

  try {
    const newTicket = await prisma.ticket.create({
      data: {
        subject,
        description,
        priority,
        status: "Open",
        userId,
        userName,
        userEmail,
      }
    });

    if (userEmail) {
      await logAuditEvent(userEmail, "Creación de Ticket", `Ticket Asunto: ${subject}, ID: ${newTicket.id}`);
    }
    revalidatePath("/tickets");
    revalidatePath(`/tickets/${newTicket.id}`);
    revalidatePath("/dashboard");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/reports");
    revalidatePath("/approvals");


    return {
      success: true,
      message: "¡Ticket creado exitosamente!",
      ticketId: newTicket.id,
    };
  } catch (error) {
    console.error("Error creating ticket in DB:", error);
    return {
      success: false,
      message: "Error de base de datos al crear el ticket.",
    };
  }
}

// --- Add Comment ---
export async function addCommentAction(
  ticketId: string,
  commenter: Pick<UserType, 'id' | 'name' | 'email' | 'avatarUrl'>,
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

  try {
    const newComment = await prisma.comment.create({
      data: {
        text: validatedFields.data.text,
        ticketId,
        userId: commenter.id,
        userName: commenter.name || "Usuario Desconocido",
        userAvatarUrl: commenter.avatarUrl,
      }
    });
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    });

    if (commenter.email) {
      await logAuditEvent(commenter.email, "Adición de Comentario", `Ticket ID: ${ticketId}, Usuario: ${commenter.name}`);
    }

    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath("/tickets");
    revalidatePath("/dashboard");
    revalidatePath("/admin/analytics");

    return {
      success: true,
      message: "¡Comentario añadido exitosamente!",
      comment: newComment,
    };
  } catch (error) {
    console.error("Error adding comment to DB:", error);
    return {
      success: false,
      message: "Error de base de datos al añadir comentario.",
    };
  }
}

// --- Update Ticket Status ---
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

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return { success: false, message: "Ticket no encontrado." };
    const oldStatus = ticket.status;

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status, updatedAt: new Date() }
    });

    await logAuditEvent(actingUserEmail, "Actualización de Estado de Ticket", `Ticket ID: ${ticketId}, De: ${oldStatus}, A: ${status}`);
    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath("/tickets");
    revalidatePath("/dashboard");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/reports");


    const statusDisplayMap: Record<string, string> = {
      Open: "Abierto", InProgress: "En Progreso", Resolved: "Resuelto", Closed: "Cerrado",
    };
    return { success: true, message: `Estado del ticket actualizado a ${statusDisplayMap[status]}.` };
  } catch (error) {
    console.error("Error updating ticket status in DB:", error);
    return { success: false, message: "Error de base de datos al actualizar estado." };
  }
}

// --- Fetch Ticket by ID ---
export async function getTicketById(ticketId: string): Promise<(TicketType & { comments: CommentType[], attachments: AttachmentTypePrisma[], user: { name: string | null, email: string | null } | null }) | null> {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { comments: { orderBy: { createdAt: 'asc' }}, attachments: true, user: { select: { name: true, email: true }} }
    });
    return ticket;
  } catch (error) {
    console.error(`Error fetching ticket by ID ${ticketId}:`, error);
    return null;
  }
}

// --- Fetch All Tickets ---
export async function getAllTickets(): Promise<(TicketType & { comments: CommentType[], attachments: AttachmentTypePrisma[], user: { name: string | null } | null })[]> {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: [{priority: 'desc'}, {createdAt: 'desc'}],
      include: { user: { select: { name: true }}, comments: true, attachments: true }
    });
    return tickets;
  } catch (error) {
    console.error("Error fetching all tickets:", error);
    return [];
  }
}

// --- Fetch Dashboard Stats ---
export async function getDashboardStats() {
  try {
    const total = await prisma.ticket.count();
    const open = await prisma.ticket.count({ where: { status: "Open" } });
    const inProgress = await prisma.ticket.count({ where: { status: "InProgress" } });
    const resolved = await prisma.ticket.count({ where: { status: "Resolved" } });
    const closed = await prisma.ticket.count({ where: { status: "Closed" } });

    const summary = { total, open, inProgress, resolved, closed };

    const byPriorityDb = await prisma.ticket.groupBy({
      by: ['priority'],
      _count: { id: true },
    });
    const byStatusDb = await prisma.ticket.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const stats = {
      byPriority: TICKET_PRIORITIES_ENGLISH.map(pKey => ({
        name: pKey as string,
        value: byPriorityDb.find(p => p.priority === pKey)?._count.id || 0,
      })),
      byStatus: TICKET_STATUSES_ENGLISH.map(sKey => ({
        name: sKey as string,
        value: byStatusDb.find(s => s.status === sKey)?._count.id || 0,
      })),
    };
    return { summary, stats };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    const placeholderSummary = { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
    const placeholderStats = { 
      byPriority: TICKET_PRIORITIES_ENGLISH.map(pKey => ({ name: pKey as string, value: 0 })),
      byStatus: TICKET_STATUSES_ENGLISH.map(sKey => ({ name: sKey as string, value: 0 }))
    };
    return { summary: placeholderSummary, stats: placeholderStats };
  }
}

// --- Inventory Actions ---
export async function getAllInventoryItems(): Promise<(InventoryItemType & { addedByUser: { name: string | null } | null })[]> {
  try {
    const items = await prisma.inventoryItem.findMany({ 
      orderBy: { createdAt: 'desc' },
      include: { addedByUser: { select: { name: true }}}
    });
    return items;
  } catch (error) {
    console.error("Error fetching all inventory items:", error);
    return [];
  }
}

export async function addInventoryItemAction(
  currentUser: Pick<UserType, 'id' | 'name' | 'email'>,
  values: Omit<z.infer<typeof BaseInventoryItemSchema>, "currentUserEmail">
) {
  const validatedFields = BaseInventoryItemSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: "Fallo al añadir artículo debido a errores de validación." };
  }
  const data = validatedFields.data;

  try {
    const newItem = await prisma.inventoryItem.create({
      data: {
        ...data,
        addedByUserId: currentUser.id,
        addedByUserName: currentUser.name || "Usuario del Sistema",
      }
    });
    
    if(currentUser.email){
      await logAuditEvent(currentUser.email, "Adición de Artículo de Inventario", `Artículo ID: ${newItem.id}, Nombre: ${data.name}`);
    }
    revalidatePath("/inventory");
    return { success: true, message: `Artículo "${data.name}" con ID "${newItem.id}" añadido exitosamente.`, item: newItem };
  } catch (error: any) {
    console.error("Error adding inventory item to DB:", error);
     if (error.code === 'P2002' && error.meta?.target?.includes('serialNumber')) {
      return { success: false, message: "Error: El número de serie ya existe en el inventario." };
    }
    return { success: false, message: "Error de base de datos al añadir artículo." };
  }
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
  const data = validatedFields.data;

  try {
    const itemToUpdate = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!itemToUpdate) return { success: false, message: "Artículo no encontrado." };

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { 
        ...data, 
        updatedAt: new Date()
      }
    });

    await logAuditEvent(actingUserEmail, "Actualización de Artículo de Inventario", `Artículo ID: ${itemId}, Nombre: ${data.name}`);
    revalidatePath("/inventory");
    return { success: true, message: `Artículo "${data.name}" actualizado exitosamente.`, item: updatedItem };
  } catch (error: any) {
    console.error("Error updating inventory item in DB:", error);
     if (error.code === 'P2002' && error.meta?.target?.includes('serialNumber')) {
      return { success: false, message: "Error: El número de serie ya existe en el inventario para otro artículo." };
    }
    return { success: false, message: "Error de base de datos al actualizar artículo." };
  }
}

export async function deleteInventoryItemAction(itemId: string, actingUserEmail: string) {
  try {
    const itemToDelete = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!itemToDelete) return { success: false, message: "Artículo no encontrado para eliminar." };
    
    await prisma.inventoryItem.delete({ where: { id: itemId } });

    await logAuditEvent(actingUserEmail, "Eliminación de Artículo de Inventario", `Artículo ID: ${itemId}, Nombre: ${itemToDelete.name}`);
    revalidatePath("/inventory");
    return { success: true, message: "Artículo eliminado exitosamente." };
  } catch (error) {
    console.error("Error deleting inventory item from DB:", error);
    return { success: false, message: "Error de base de datos al eliminar artículo." };
  }
}

const excelToInternalFieldMap: Record<string, keyof z.infer<typeof BaseInventoryItemSchema>> = {
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
      } else if (internalField === 'category') {
        const normalizedValue = String(value).toLowerCase().replace(/\s/g,"").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const foundValue = INVENTORY_ITEM_CATEGORIES.find(opt => opt.toLowerCase().replace(/\s/g,"").replace(" ","").normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedValue);
        (mapped as any)[internalField] = foundValue || undefined;
      } else if (internalField === 'status') {
         const normalizedValue = String(value).toLowerCase().replace(/\s/g,"").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
         const foundValue = INVENTORY_ITEM_STATUSES.find(opt => opt.toLowerCase().replace(/\s/g,"").replace(" ","").normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedValue);
        (mapped as any)[internalField] = foundValue || undefined;
      } else if (internalField === 'ram') {
        const normalizedValue = String(value).toUpperCase().replace(/\s/g,"");
        const foundValue = RAM_OPTIONS.find(opt => opt.toUpperCase().replace(/\s/g,"") === normalizedValue);
        (mapped as any)[internalField] = foundValue || undefined;
      } else if (internalField === 'storageType') {
        const normalizedValue = String(value).toUpperCase().replace(/\s/g,"");
        const foundValue = STORAGE_TYPES_ZOD_ENUM.find(opt => opt.toUpperCase().replace(/\s/g,"") === normalizedValue);
        (mapped as any)[internalField] = foundValue || undefined;
      }
      else {
         (mapped as any)[internalField] = value === null || value === undefined ? undefined : String(value).trim();
      }
    }
  }
  if (mapped.quantity === undefined || isNaN(Number(mapped.quantity))) mapped.quantity = 1;
  if (mapped.status === undefined) mapped.status = "EnUso" as InventoryItemStatus;
  return mapped;
};

export async function importInventoryItemsAction(
  itemDataArray: ExcelInventoryItemData[],
  currentUserEmail: string,
  currentUserId: string,
  currentUserName: string
): Promise<{ success: boolean; message: string; successCount: number; errorCount: number; errors: { row: number; message: string; data: ExcelInventoryItemData }[]; importedItems: InventoryItemType[] }> {
  if (!itemDataArray || itemDataArray.length === 0) {
    return { success: false, message: "No se proporcionaron datos para importar o el archivo está vacío.", successCount: 0, errorCount: itemDataArray?.length || 0, errors: [{ row: 0, message: "Archivo vacío o sin datos.", data: {} }], importedItems: [] };
  }
  
  let successCount = 0;
  let errorCount = 0;
  const errors: { row: number; message: string; data: ExcelInventoryItemData }[] = [];
  const importedItems: InventoryItemType[] = [];

  try {
    for (let i = 0; i < itemDataArray.length; i++) {
      const rawRow = itemDataArray[i];
      try {
        const mappedData = mapExcelRowToInventoryItemFormValues(rawRow);
        const validatedFields = BaseInventoryItemSchema.safeParse(mappedData);

        if (!validatedFields.success) {
          errorCount++;
          const fieldErrors = validatedFields.error.flatten().fieldErrors as Record<string, string[] | undefined>;
          let errorMessage = Object.entries(fieldErrors)
            .map(([field, messages]) => `${field}: ${(messages || ['Error desconocido']).join(', ')}`)
            .join('; ') || "Error desconocido en validación.";
          errors.push({ row: i + 2, message: `Error de validación: ${errorMessage}`, data: rawRow });
          continue;
        }
        
        const dataToCreate = {
          ...validatedFields.data,
          addedByUserId: currentUserId,
          addedByUserName: currentUserName,
        };

        if (dataToCreate.serialNumber && dataToCreate.serialNumber.trim() !== "") {
          const existingItemBySerial = await prisma.inventoryItem.findUnique({
            where: { serialNumber: dataToCreate.serialNumber },
          });
          if (existingItemBySerial) {
            errorCount++;
            errors.push({ row: i + 2, message: `Error: Número de serie '${dataToCreate.serialNumber}' ya existe.`, data: rawRow });
            continue;
          }
        }
        
        const newItem = await prisma.inventoryItem.create({ data: dataToCreate });
        importedItems.push(newItem);
        successCount++;
      } catch (e: any) {
        errorCount++;
        errors.push({ row: i + 2, message: `Error procesando fila: ${e.message || String(e)}`, data: rawRow });
      }
    }

    if (successCount > 0) {
      await logAuditEvent(currentUserEmail, "Importación Masiva de Inventario", `Se importaron ${successCount} artículos. Errores: ${errorCount}.`);
    } else if (errorCount > 0 && itemDataArray.length > 0) {
      await logAuditEvent(currentUserEmail, "Intento Fallido de Importación Masiva de Inventario", `No se importaron artículos. Errores: ${errorCount} de ${itemDataArray.length} filas.`);
    }
    
    revalidatePath("/inventory");
    return { 
      success: successCount > 0 && errorCount === 0, 
      message: `Importación completada. ${successCount} artículos importados. ${errorCount > 0 ? `${errorCount} filas con errores.` : ''}`, 
      successCount, 
      errorCount, 
      errors, 
      importedItems 
    };

  } catch (globalError: any) {
    console.error("Error global durante la importación de inventario:", globalError);
    return { 
      success: false, 
      message: `Error general durante la importación: ${globalError.message || "Error desconocido"}`, 
      successCount, 
      errorCount: itemDataArray.length - successCount,
      errors, 
      importedItems 
    };
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

  try {
    let newApproval;
    await prisma.$transaction(async (tx) => {
        const approvalData: any = {
            type: data.type,
            subject: data.subject,
            description: data.description,
            status: "Pendiente",
            requesterId: data.requesterId,
            requesterName: data.requesterName,
            requesterEmail: data.requesterEmail,
            attachments: data.attachmentsData && data.attachmentsData.length > 0 ? {
                create: data.attachmentsData.map(att => ({
                    fileName: att.fileName,
                    url: "placeholder/url/" + att.fileName, // Placeholder URL
                    size: att.size,
                    type: att.type,
                }))
            } : undefined,
        };

        if (data.type === "Compra") {
            approvalData.itemDescription = data.itemDescription;
            approvalData.estimatedPrice = data.estimatedPrice;
            approvalData.supplierCompra = data.supplierCompra;
        } else if (data.type === "PagoProveedor") {
            approvalData.supplierPago = data.supplierPago;
            approvalData.totalAmountToPay = data.totalAmountToPay;
        }

        newApproval = await tx.approvalRequest.create({
            data: approvalData
        });

        await tx.approvalActivityLogEntry.create({
            data: {
                approvalRequestId: newApproval.id,
                action: "Solicitud Creada",
                userId: data.requesterId,
                userName: data.requesterName,
                comment: "Solicitud creada inicialmente.",
            }
        });
    });


    if (data.requesterEmail && newApproval) {
      await logAuditEvent(data.requesterEmail, `Creación de Solicitud de Aprobación (${data.type})`, `Asunto: ${data.subject}, ID: ${newApproval.id}`);
    }
    revalidatePath("/approvals");
    revalidatePath("/dashboard");
    if (newApproval) {
        revalidatePath(`/approvals/${newApproval.id}`);
    }

    return {
      success: true,
      message: `Solicitud de ${data.type === "Compra" ? "Compra" : "Pago a Proveedores"} enviada exitosamente.`,
      approvalId: newApproval?.id,
    };
  } catch (error) {
    console.error("Error creating approval request in DB:", error);
    return { success: false, message: "Error de base de datos al crear solicitud de aprobación." };
  }
}

export async function getApprovalRequestsForUser(userId: string, userRole: UserRoleEnum): Promise<ApprovalRequestTypePrisma[]> {
  try {
    if (userRole === "PresidenteIEQ") {
      return await prisma.approvalRequest.findMany({
        where: { status: { in: ["Pendiente", "InformacionSolicitada"] } },
        include: { requester: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      });
    }
    return await prisma.approvalRequest.findMany({
      where: { requesterId: userId },
      include: { requester: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Error fetching approval requests for user:", error);
    return [];
  }
}

export async function getApprovalRequestDetails(id: string): Promise<(ApprovalRequestTypePrisma & { attachments: AttachmentTypePrisma[], activityLog: (ApprovalActivityLogEntryTypePrisma & { user: { name: string | null } | null })[], paymentInstallments: PaymentInstallmentTypePrisma[] }) | null> {
  try {
    return await prisma.approvalRequest.findUnique({
      where: { id },
      include: { 
        requester: { select: { name: true, email: true } }, 
        approver: { select: { name: true, email: true } },
        attachments: true, 
        activityLog: { 
            include: { user: { select: { name: true }}},
            orderBy: { timestamp: 'desc' } 
        }, 
        paymentInstallments: { orderBy: { dueDate: 'asc' }}
      }
    });
  } catch (error) {
    console.error(`Error fetching approval request details for ID ${id}:`, error);
    return null;
  }
}

export async function approveRequestAction(
  values: any
): Promise<{ success: boolean; message: string }> {
  const { requestId, approverId, approverName, approverEmail, comment, approvedPaymentType, approvedAmount, installments } = values;

  try {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) return { success: false, message: "Solicitud no encontrada." };
    if (request.status !== "Pendiente" && request.status !== "InformacionSolicitada") {
      return { success: false, message: "La solicitud no está en un estado que permita aprobación." };
    }

    let validatedData;
    if (request.type === "PagoProveedor") {
        if (approvedPaymentType === "Contado") {
            validatedData = ApprovePagoProveedorContadoSchema.parse(values);
        } else if (approvedPaymentType === "Cuotas") {
            validatedData = ApprovePagoProveedorCuotasSchema.parse(values);
        } else {
            return { success: false, message: "Tipo de pago no válido para Pago a Proveedor." };
        }
    } else if (request.type === "Compra") {
        validatedData = ApproveCompraSchema.parse(values);
    } else {
        return { success: false, message: "Tipo de solicitud desconocida." };
    }
    
    await prisma.$transaction(async (tx) => {
        const updateData: any = {
            status: "Aprobado" as ApprovalStatusEnumType,
            approverId,
            approverName,
            approverComment: validatedData.comment,
            approvedAt: new Date(),
        };

        if (request.type === "PagoProveedor") {
            updateData.approvedPaymentType = validatedData.approvedPaymentType;
            updateData.approvedAmount = validatedData.approvedAmount;
            
            await tx.paymentInstallment.deleteMany({ where: { approvalRequestId: requestId }});
            if (validatedData.approvedPaymentType === "Cuotas" && validatedData.installments && validatedData.installments.length > 0) {
                await tx.paymentInstallment.createMany({
                    data: validatedData.installments.map((inst: any) => ({
                        amount: inst.amount,
                        dueDate: new Date(inst.dueDate),
                        approvalRequestId: requestId,
                    }))
                });
            }
        }
        
        await tx.approvalRequest.update({ where: { id: requestId }, data: updateData });

        await tx.approvalActivityLogEntry.create({
            data: {
                approvalRequestId: requestId,
                action: "Solicitud Aprobada",
                userId: approverId,
                userName: approverName,
                comment: validatedData.comment || "Aprobado sin comentarios adicionales.",
            }
        });
    });

    await logAuditEvent(approverEmail, "Aprobación de Solicitud", `ID Solicitud: ${requestId}, Aprobador: ${approverName}. Comentario: ${validatedData.comment || 'N/A'}.`);
    revalidatePath(`/approvals/${requestId}`);
    revalidatePath('/approvals');
    revalidatePath('/dashboard');
    return { success: true, message: "Solicitud aprobada exitosamente." };
  } catch (error: any) {
    console.error("Error approving request:", error);
    if (error instanceof z.ZodError) {
        return { success: false, message: "Error de validación: " + error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ') };
    }
    return { success: false, message: "Error de base de datos al aprobar la solicitud." };
  }
}

export async function rejectRequestAction(
  values: z.infer<typeof RejectOrInfoActionSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = RejectOrInfoActionSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.flatten().fieldErrors.comment?.[0] || "Error de validación." };
  }
  const { requestId, approverId, approverName, approverEmail, comment } = validatedFields.data;

  try {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) return { success: false, message: "Solicitud no encontrada." };
     if (request.status !== "Pendiente" && request.status !== "InformacionSolicitada") {
      return { success: false, message: "La solicitud no está en un estado que permita rechazo." };
    }

    await prisma.$transaction(async (tx) => {
        await tx.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: "Rechazado" as ApprovalStatusEnumType,
                approverId,
                approverName,
                approverComment: comment,
                rejectedAt: new Date(),
            }
        });

        await tx.approvalActivityLogEntry.create({
            data: {
                approvalRequestId: requestId,
                action: "Solicitud Rechazada",
                userId: approverId,
                userName: approverName,
                comment: comment,
            }
        });
    });

    await logAuditEvent(approverEmail, "Rechazo de Solicitud", `ID Solicitud: ${requestId}, Aprobador: ${approverName}. Comentario: ${comment}`);
    revalidatePath(`/approvals/${requestId}`);
    revalidatePath('/approvals');
    revalidatePath('/dashboard');
    return { success: true, message: "Solicitud rechazada." };
  } catch (error) {
    console.error("Error rejecting request:", error);
    return { success: false, message: "Error de base de datos al rechazar solicitud." };
  }
}

export async function requestMoreInfoAction(
  values: z.infer<typeof RejectOrInfoActionSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = RejectOrInfoActionSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.flatten().fieldErrors.comment?.[0] || "Error de validación." };
  }
  const { requestId, approverId, approverName, approverEmail, comment } = validatedFields.data;

  try {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
    if (!request) return { success: false, message: "Solicitud no encontrada." };
     if (request.status !== "Pendiente" && request.status !== "InformacionSolicitada") {
      return { success: false, message: "La solicitud no está en un estado que permita solicitar más información." };
    }

    await prisma.$transaction(async (tx) => {
        await tx.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: "InformacionSolicitada" as ApprovalStatusEnumType,
                approverId, 
                approverName,
                infoRequestedAt: new Date(),
            }
        });

        await tx.approvalActivityLogEntry.create({
            data: {
                approvalRequestId: requestId,
                action: "Información Adicional Solicitada",
                userId: approverId,
                userName: approverName,
                comment: comment,
            }
        });
    });
    

    await logAuditEvent(approverEmail, "Solicitud de Más Información", `ID Solicitud: ${requestId}, Aprobador: ${approverName}. Comentario: ${comment}`);
    revalidatePath(`/approvals/${requestId}`);
    revalidatePath('/approvals');
    revalidatePath('/dashboard');
    return { success: true, message: "Se solicitó más información." };
  } catch (error) {
    console.error("Error requesting more info:", error);
    return { success: false, message: "Error de base de datos al solicitar más información." };
  }
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

  try {
    const newCaso = await prisma.casoDeMantenimiento.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        equipment: data.equipment,
        priority: data.priority,
        assignedProviderName: data.assignedProviderName,
        currentStatus: "Registrado",
        registeredAt: new Date(),
        registeredByUserId: currentUserId,
        registeredByUserName: currentUserName,
        log: {
          create: [{
            action: "Caso Registrado",
            notes: "Caso de mantenimiento inicial registrado.",
            userId: currentUserId,
            userName: currentUserName,
            statusAfterAction: "Registrado"
          }]
        }
      }
    });

    await logAuditEvent(currentUserEmail, "Registro de Nuevo Caso de Mantenimiento", `Título: ${data.title}, ID: ${newCaso.id}`);
    revalidatePath("/mantenimiento");

    return {
      success: true,
      message: "Caso de mantenimiento registrado exitosamente.",
      casoId: newCaso.id,
    };
  } catch (error) {
    console.error("Error creating caso de mantenimiento:", error);
    return { success: false, message: "Error de base de datos al crear caso de mantenimiento." };
  }
}

export async function getAllCasosMantenimientoAction(): Promise<(CasoDeMantenimientoTypePrisma & { log: CasoMantenimientoLogEntryTypePrisma[], registeredByUser: { name: string | null } | null })[]> {
  try {
    return await prisma.casoDeMantenimiento.findMany({
      include: { 
        registeredByUser: { select: { name: true }}, 
        log: { orderBy: { timestamp: 'desc' }} 
      },
      orderBy: { registeredAt: 'desc' }
    });
  } catch (error) {
    console.error("Error fetching casos de mantenimiento:", error);
    return [];
  }
}

export async function getCasoMantenimientoByIdAction(id: string): Promise<(CasoDeMantenimientoTypePrisma & { log: (CasoMantenimientoLogEntryTypePrisma & {user: { name: string | null }})[], registeredByUser: { name: string | null } | null }) | null> {
   try {
    return await prisma.casoDeMantenimiento.findUnique({
      where: { id },
      include: { 
        registeredByUser: { select: { name: true }}, 
        log: { 
          include: { user: { select: { name: true }}},
          orderBy: { timestamp: 'desc' }
        }
      }
    });
  } catch (error) {
    console.error(`Error fetching caso de mantenimiento by ID ${id}:`, error);
    return null;
  }
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
   const { currentStatus, notes, assignedProviderName, nextFollowUpDate, resolutionDetails, cost, invoicingDetails, resolvedAt } = validatedFields.data;

   try {
    const casoToUpdate = await prisma.casoDeMantenimiento.findUnique({ where: { id: casoId }});
    if (!casoToUpdate) return { success: false, message: "Caso no encontrado." };

    const dataToUpdate: any = {
        currentStatus: currentStatus,
        assignedProviderName,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        lastFollowUpDate: new Date(), 
    };

    if (currentStatus === "Resuelto") {
        if (!resolutionDetails || !resolvedAt) {
            return { success: false, message: "Para el estado 'Resuelto', los Detalles de Resolución y la Fecha de Resolución son obligatorios."};
        }
        dataToUpdate.resolutionDetails = resolutionDetails;
        dataToUpdate.cost = cost;
        dataToUpdate.invoicingDetails = invoicingDetails;
        dataToUpdate.resolvedAt = new Date(resolvedAt);
    } else {
        dataToUpdate.resolutionDetails = null;
        dataToUpdate.cost = null;
        dataToUpdate.invoicingDetails = null;
        dataToUpdate.resolvedAt = null;
    }
    
    await prisma.$transaction(async (tx) => {
        await tx.casoDeMantenimiento.update({
            where: { id: casoId },
            data: dataToUpdate
        });
        await tx.casoMantenimientoLogEntry.create({
            data: {
                casoId: casoId,
                action: `Actualización de Estado: ${currentStatus}`,
                notes: notes,
                userId: actingUserId,
                userName: actingUserName,
                statusAfterAction: currentStatus
            }
        });
    });

    await logAuditEvent(actingUserEmail, `Actualización de Caso de Mantenimiento: ${currentStatus}`, `ID Caso: ${casoId}. Notas: ${notes}`);
    revalidatePath(`/mantenimiento/${casoId}`);
    revalidatePath("/mantenimiento");
    return { success: true, message: `Caso de mantenimiento actualizado a ${currentStatus}.` };
   } catch (error) {
     console.error("Error updating caso de mantenimiento:", error);
     return { success: false, message: "Error de base de datos al actualizar caso de mantenimiento." };
   }
}

// --- AI Solution Suggestion ---
// No longer needed, but keeping structure if it were to be re-added elsewhere.
// import { ai } from '@/ai/genkit';
// export async function getAISolutionSuggestion(ticketDescription: string): Promise<{ suggestion?: string; error?: string }> {
//   // This will be replaced by the AI Flow for suggesting solutions
//   // For now, a placeholder:
//   // return { suggestion: `Based on "${ticketDescription}", try restarting the device. If that doesn't work, check network cables.` };
//   return { error: "AI suggestion feature is not implemented yet."};
// }
