
"use server";

import { z } from "zod";
import type { Ticket, Comment, TicketPriority, TicketStatus, User, InventoryItem, InventoryItemCategory, InventoryItemStatus, StorageType } from "./types";
import type { AuditLogEntry as AuditLogEntryType } from "./mock-data"; // Import type for clarity
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
  getAllAuditLogsFromMock 
} from "./mock-data";
import { revalidatePath } from "next/cache";
import { TICKET_PRIORITIES_ENGLISH, TICKET_STATUSES_ENGLISH } from "./constants";
import { INVENTORY_ITEM_CATEGORIES, INVENTORY_ITEM_STATUSES, RAM_OPTIONS, STORAGE_TYPES_ZOD_ENUM } from "./types";

// --- Audit Log Actions ---
export async function logAuditEvent(performingUserEmail: string, actionDescription: string, details?: string): Promise<void> {
  try {
    addAuditLogEntryToMock({
      user: performingUserEmail,
      action: actionDescription,
      details: details || undefined,
    });
    revalidatePath("/admin/audit"); 
  } catch (error)
    // Depending on requirements, you might want to throw the error or handle it silently
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
    Open: "Abierto",
    "In Progress": "En Progreso",
    Resolved: "Resuelto",
    Closed: "Cerrado",
  };

  return {
    success: true,
    message: `Estado del ticket actualizado a ${statusDisplayMap[ticket.status]}.`,
  };
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

  const byPriority = (TICKET_PRIORITIES_ENGLISH).map(pKey  => ({
    name: priorityDisplayMap[pKey],
    value: currentTickets.filter(t => t.priority === pKey).length,
  }));

  const byStatus = (TICKET_STATUSES_ENGLISH).map(sKey => ({
    name: statusDisplayMap[sKey],
    value: currentTickets.filter(t => t.status === sKey).length,
  }));

  return {
    summary: { total, open, inProgress, resolved, closed },
    stats: { byPriority, byStatus },
  };
}

// --- Inventory Actions ---

// Fetch All Inventory Items
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
  Computadora: "PC",
  Monitor: "MON",
  Teclado: "TEC",
  Mouse: "MOU",
  Impresora: "IMP",
  Escaner: "ESC",
  Router: "ROU",
  Switch: "SWI",
  Servidor: "SRV",
  Laptop: "LAP",
  Tablet: "TAB",
  Proyector: "PRO",
  "Telefono IP": "TIP",
  "Otro Periferico": "PER",
  Software: "SOF",
  Licencia: "LIC",
  Otro: "OTR",
};

export async function addInventoryItemAction(
  currentUser: Pick<User, 'id' | 'name' | 'email'>, 
  values: Omit<z.infer<typeof BaseInventoryItemSchema>, "currentUserEmail"> 
) {
  const validatedFields = BaseInventoryItemSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al añadir artículo debido a errores de validación.",
    };
  }

  const data = validatedFields.data;
  
  const prefix = categoryPrefixMap[data.category as InventoryItemCategory];
  const allItems = getRawInventoryStore(); 

  let maxNum = 0;
  allItems.forEach(item => {
    if (item.id.startsWith(`${prefix}-IEQ-`)) {
      try {
        const numPart = parseInt(item.id.substring(item.id.lastIndexOf('-') + 1), 10);
        if (numPart > maxNum) {
          maxNum = numPart;
        }
      } catch (e) {
        // Error parsing item ID number
      }
    }
  });

  const newNum = maxNum + 1;
  const formattedNum = String(newNum).padStart(3, '0');
  const newId = `${prefix}-IEQ-${formattedNum}`;

  const newItem: InventoryItem = {
    id: newId,
    ...data, 
    category: data.category as InventoryItemCategory, 
    status: data.status as InventoryItemStatus, 
    addedByUserId: currentUser.id,
    addedByUserName: currentUser.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  addInventoryItemToMock(newItem);
  
  await logAuditEvent(currentUser.email, "Adición de Artículo de Inventario", `Artículo ID: ${newItem.id}, Nombre: ${newItem.name}`);

  revalidatePath("/inventory");

  return {
    success: true,
    message: `Artículo "${newItem.name}" con ID "${newId}" añadido exitosamente.`,
    item: newItem,
  };
}


export async function updateInventoryItemAction(
  itemId: string,
  actingUserEmail: string, 
  values: Omit<z.infer<typeof BaseInventoryItemSchema>, "actingUserEmail"> 
) {
  const validatedFields = BaseInventoryItemSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Fallo al actualizar artículo debido a errores de validación.",
    };
  }
  const itemToUpdate = getInventoryItemByIdFromMock(itemId);
  if (!itemToUpdate) {
    return { success: false, message: "Artículo no encontrado." };
  }
  
  const updatedData = validatedFields.data;

  const updatedItem: InventoryItem = {
    ...itemToUpdate,
    ...updatedData,
    category: updatedData.category as InventoryItemCategory,
    status: updatedData.status as InventoryItemStatus,
    updatedAt: new Date(),
  };

  const success = updateInventoryItemInMock(updatedItem);

  if (success) {
    
    await logAuditEvent(actingUserEmail, "Actualización de Artículo de Inventario", `Artículo ID: ${itemId}, Nombre: ${updatedItem.name}`);
    revalidatePath("/inventory");
    return { success: true, message: `Artículo "${updatedItem.name}" actualizado exitosamente.` };
  } else {
    return { success: false, message: "No se pudo actualizar el artículo." };
  }
}

export async function deleteInventoryItemAction(itemId: string, actingUserEmail: string) { 
  const itemToDelete = getInventoryItemByIdFromMock(itemId);
  if (!itemToDelete) {
    return { success: false, message: "Artículo no encontrado para eliminar." };
  }

  const success = deleteInventoryItemFromMock(itemId);
  if (success) {
    
    await logAuditEvent(actingUserEmail, "Eliminación de Artículo de Inventario", `Artículo ID: ${itemId}, Nombre: ${itemToDelete.name}`);
    revalidatePath("/inventory");
    return { success: true, message: "Artículo eliminado exitosamente." };
  } else {
    return { success: false, message: "No se pudo eliminar el artículo o no fue encontrado." };
  }
}


// Type for data expected from Excel (can be more lenient initially)
export type ExcelInventoryItemData = {
  // All fields are optional as they might be missing in Excel
  // Using string for most to handle varied Excel inputs, conversion/validation happens later
  Nombre?: string;
  Categoría?: string;
  Marca?: string;
  Modelo?: string;
  'Número de Serie'?: string; // Excel header might have spaces
  Procesador?: string;
  RAM?: string;
  'Tipo de Almacenamiento'?: string;
  'Capacidad de Almacenamiento'?: string;
  Cantidad?: string | number;
  Ubicación?: string;
  Estado?: string;
  'Notas Adicionales'?: string;
  [key: string]: any; // Allow other columns
};

const excelToInternalFieldMap: Record<string, keyof InventoryItem> = {
  'nombre': 'name',
  'categoría': 'category',
  'categoria': 'category',
  'marca': 'brand',
  'modelo': 'model',
  'número de serie': 'serialNumber',
  'numero de serie': 'serialNumber',
  'n/s': 'serialNumber',
  'procesador': 'processor',
  'ram': 'ram',
  'tipo de almacenamiento': 'storageType',
  'tipo de disco': 'storageType',
  'capacidad de almacenamiento': 'storage',
  'almacenamiento': 'storage',
  'cantidad': 'quantity',
  'ubicación': 'location',
  'ubicacion': 'location',
  'departamento': 'location',
  'estado': 'status',
  'notas adicionales': 'notes',
  'notas': 'notes',
};

const mapExcelRowToInventoryItemFormValues = (row: ExcelInventoryItemData): Partial<z.infer<typeof BaseInventoryItemSchema>> => {
  const mapped: Partial<z.infer<typeof BaseInventoryItemSchema>> = {};
  for (const excelHeader in row) {
    const lowerExcelHeader = excelHeader.toLowerCase().trim();
    const internalField = excelToInternalFieldMap[lowerExcelHeader];
    if (internalField) {
      let value = row[excelHeader];
      if (internalField === 'quantity' && typeof value === 'string') {
        const parsedQuantity = parseInt(value, 10);
        (mapped as any)[internalField] = isNaN(parsedQuantity) ? undefined : parsedQuantity;
      } else if (internalField === 'category') {
        const foundCategory = INVENTORY_ITEM_CATEGORIES.find(cat => cat.toLowerCase() === String(value).toLowerCase());
        (mapped as any)[internalField] = foundCategory || undefined;
      } else if (internalField === 'status') {
         const foundStatus = INVENTORY_ITEM_STATUSES.find(stat => stat.toLowerCase() === String(value).toLowerCase());
        (mapped as any)[internalField] = foundStatus || undefined;
      } else if (internalField === 'ram') {
        const foundRam = RAM_OPTIONS.find(r => String(value).toLowerCase().replace(/\s/g, '') === r.toLowerCase().replace(/\s/g, ''));
        (mapped as any)[internalField] = foundRam || undefined;
      } else if (internalField === 'storageType') {
        const foundStorageType = STORAGE_TYPES_ZOD_ENUM.find(st => String(value).toLowerCase() === st.toLowerCase());
         (mapped as any)[internalField] = foundStorageType || undefined;
      }
      else {
        (mapped as any)[internalField] = value === null || value === undefined ? undefined : String(value).trim();
      }
    }
  }
  return mapped;
};


export async function importInventoryItemsAction(
  itemDataArray: ExcelInventoryItemData[],
  currentUserEmail: string,
  currentUserId: string,
  currentUserName: string
) {
  let successCount = 0;
  let errorCount = 0;
  const errors: { row: number; message: string; data: ExcelInventoryItemData }[] = [];
  const importedItems: InventoryItem[] = [];

  for (let i = 0; i < itemDataArray.length; i++) {
    const rawRow = itemDataArray[i];
    const mappedData = mapExcelRowToInventoryItemFormValues(rawRow);
    
    // Set defaults if not present, especially for required fields not perfectly mapped
    if (!mappedData.quantity) mappedData.quantity = 1;
    if (!mappedData.status) mappedData.status = "En Uso"; // Default status if not in Excel


    const validatedFields = BaseInventoryItemSchema.safeParse(mappedData);

    if (!validatedFields.success) {
      errorCount++;
      errors.push({
        row: i + 2, // Assuming Excel row numbers start from 1 and row 1 is header
        message: Object.values(validatedFields.error.flatten().fieldErrors).flat().join('; ') || "Error de validación desconocido.",
        data: rawRow,
      });
      continue;
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
      id: newId,
      ...data,
      category: data.category as InventoryItemCategory,
      status: data.status as InventoryItemStatus,
      addedByUserId: currentUserId,
      addedByUserName: currentUserName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    if (newItem.category === "Computadora") {
        newItem.ram = data.ram === "No Especificado" ? undefined : data.ram;
        newItem.storageType = data.storageType;
        newItem.storage = data.storage;
        newItem.processor = data.processor;
    } else {
        newItem.ram = undefined;
        newItem.storageType = undefined;
        newItem.storage = undefined;
        newItem.processor = undefined;
    }


    addInventoryItemToMock(newItem);
    importedItems.push(newItem);
    successCount++;
  }

  if (successCount > 0) {
    await logAuditEvent(currentUserEmail, "Importación Masiva de Inventario", `Se importaron ${successCount} artículos. Errores: ${errorCount}.`);
  } else if (errorCount > 0) {
     await logAuditEvent(currentUserEmail, "Intento Fallido de Importación Masiva de Inventario", `No se importaron artículos. Errores: ${errorCount}.`);
  }


  revalidatePath("/inventory");

  return {
    success: successCount > 0,
    message: `Importación completada. ${successCount} artículos importados, ${errorCount} filas con errores.`,
    successCount,
    errorCount,
    errors,
    importedItems
  };
}
    
